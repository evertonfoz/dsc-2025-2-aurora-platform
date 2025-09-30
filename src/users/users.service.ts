import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserRole } from './domain/user-role.enum';
import { PaginationQueryDto } from './dtos/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  // util pra tirar o hash das respostas
  private stripSensitive(u: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = u;
    return safe;
  }

  private async hash(plain: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  async create(dto: CreateUserDto) {
    const email = this.normalizeEmail(dto.email);
    const name = this.normalizeName(dto.name);

    // checagem preliminar (melhora UX), mas não substitui o tratamento do 23505
    const exists = await this.repo.findOne({ where: { email } });
    if (exists) throw new ConflictException('E-mail já registrado.');

    const pepper = process.env.HASH_PEPPER ?? ''; // opcional
    const entity = this.repo.create({
      name,
      email,
      passwordHash: await this.hash(dto.password + pepper),
      role: dto.role ?? UserRole.STUDENT,
      avatarUrl: null, // garante shape consistente quando não enviado
    });

    try {
      const saved = await this.repo.save(entity);
      return this.stripSensitive(saved);
    } catch (err) {
      // condição de corrida: índice único de e-mail no banco
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code: string }).code === '23505'
      ) {
        throw new ConflictException('E-mail já registrado.');
      }
      throw err;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, q, role, isActive } = query;

    // saneamento
    const safePage = Number.isFinite(+page) && +page > 0 ? +page : 1;
    const rawLimit = Number.isFinite(+limit) ? +limit : 20;
    const safeLimit = Math.min(Math.max(rawLimit, 1), 100);

    const where: Record<string, unknown>[] = [];
    if (q?.trim()) {
      where.push({ name: ILike(`%${q.trim()}%`) });
      where.push({ email: ILike(`%${q.trim()}%`) });
    }

    const roleCond = role ? { role } : {};
    const activeCond =
      typeof isActive === 'boolean' ? { isActive: isActive } : {};
    const whereClause =
      where.length > 0
        ? where.map((w) => ({ ...w, ...roleCond, ...activeCond }))
        : { ...roleCond, ...activeCond };

    const [data, total] = await this.repo.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data: data.map((u) => this.stripSensitive(u)),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.stripSensitive(user);
  }

  // async update(id: number, dto: UpdateUserDto) {
  //   const user = await this.repo.findOne({ where: { id } });
  //   if (!user) throw new NotFoundException('Usuário não encontrado.');

  //   // se for atualizar email, garanta unicidade
  //   if (dto.email && dto.email !== user.email) {
  //     const emailInUse = await this.repo.findOne({
  //       where: { email: dto.email },
  //     });
  //     if (emailInUse) throw new ConflictException('E-mail já registrado.');
  //   }

  //   // password opcional no UpdateUserDto
  //   let passwordHash: string | undefined;
  //   if ((dto as any).password) {
  //     passwordHash = await this.hash((dto as any).password);
  //   }

  //   Object.assign(user, {
  //     name: dto.name ?? user.name,
  //     email: dto.email ?? user.email,
  //     role: dto.role ?? user.role,
  //     isActive: dto.isActive ?? user.isActive,
  //     avatarUrl: dto.avatarUrl ?? user.avatarUrl,
  //     ...(passwordHash ? { passwordHash } : {}),
  //   });

  //   const saved = await this.repo.save(user);
  //   return this.stripSensitive(saved);
  // }

  // async remove(id: number) {
  //   const user = await this.repo.findOne({ where: { id } });
  //   if (!user) throw new NotFoundException('Usuário não encontrado.');
  //   await this.repo.remove(user);
  //   return { deleted: true };
  // }
}
