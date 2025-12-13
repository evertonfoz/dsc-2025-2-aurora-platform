import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  private toDto(u: User): UserDto {
    return {
      id: String(u.id),
      email: u.email,
      name: u.name,
      roles: [u.role],
      lastLogoutAt: u.lastLogoutAt ? u.lastLogoutAt.toISOString() : null,
    } as UserDto;
  }

  async setLastLogoutAt(id: string, date: Date): Promise<UserDto> {
    const asNumber = Number(id);
    const user = await this.repo.findOne({ where: { id: asNumber } as any });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    user.lastLogoutAt = date;
    const saved = (await this.repo.save(user)) as unknown as User;
    return this.toDto(saved);
  }

  async onModuleInit(): Promise<void> {
    // ensure two seeded users for backward compatibility with auth-service tests
    // Wrap in try-catch to avoid crashing if migrations haven't run yet
    try {
      const adminEmail = 'admin.user@example.com';
      const testEmail = 'test.user@example.com';
      const pepper = process.env.HASH_PEPPER ?? '';

      const existingAdmin = await this.repo.findOne({
        where: { email: ILike(adminEmail) } as any,
      });
      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('AdminP@ss1' + pepper, salt);
        const admin = this.repo.create({
          name: 'Admin User',
          email: adminEmail,
          passwordHash,
          role: 'admin',
        } as any);
        await this.repo.save(admin);
        console.log('[UsersService] Seeded admin user: admin.user@example.com');
      }

      const existingTest = await this.repo.findOne({
        where: { email: ILike(testEmail) } as any,
      });
      if (!existingTest) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('StrongP@ssw0rd' + pepper, salt);
        const testUser = this.repo.create({
          name: 'Test User',
          email: testEmail,
          passwordHash,
          role: 'student',
        } as any);
        await this.repo.save(testUser);
        console.log('[UsersService] Seeded test user: test.user@example.com');
      }
    } catch (error) {
      // Log warning but don't crash - migrations may not have run yet
      console.warn('[UsersService] Could not seed users (tables may not exist yet):', error.message);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const passwordHash = createUserDto.password
      ? await (async () => {
          const s = await bcrypt.genSalt(10);
          return bcrypt.hash(
            createUserDto.password + (process.env.HASH_PEPPER ?? ''),
            s,
          );
        })()
      : '';
    const user = this.repo.create({
      name: createUserDto.name ?? createUserDto.email,
      email: createUserDto.email,
      passwordHash,
    } as any);
    const saved = (await this.repo.save(user)) as unknown as User;
    return this.toDto(saved);
  }

  async findOne(
    id: string,
    _ctx?: { id?: number; isAdmin?: boolean },
  ): Promise<UserDto> {
    const asNumber = Number(id);
    const user = await this.repo.findOne({ where: { id: asNumber } as any });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return this.toDto(user);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserDto | null> {
    const user = await this.repo.findOne({
      where: { email: ILike(email) } as any,
    });
    if (!user) return null;
    try {
      const pepper = process.env.HASH_PEPPER ?? '';
      if (await bcrypt.compare(password + pepper, user.passwordHash))
        return this.toDto(user);
    } catch (e) {
      return null;
    }
    return null;
  }

  // New: list with pagination and filters
  async list(opts: { page: number; limit: number; filters?: any }) {
    const { page, limit, filters } = opts;
    const qb = this.repo.createQueryBuilder('user');
    if (filters?.q) {
      qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', {
        q: `%${filters.q}%`,
      });
    }
    if (filters?.role) {
      qb.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters?.isActive !== undefined) {
      qb.andWhere('user.is_active = :isActive', {
        isActive: !!filters.isActive,
      });
    }
    const [data, total] = await qb
      .orderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data: data.map((d) => this.toDto(d)),
      meta: { total, page, limit },
    };
  }

  // New: update
  async update(
    id: string,
    dto: Partial<CreateUserDto> & any,
    _ctx?: { id?: number; isAdmin?: boolean },
  ): Promise<UserDto> {
    const asNumber = Number(id);
    const user = await this.repo.findOne({ where: { id: asNumber } as any });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    if (dto.password) {
      const pepper = process.env.HASH_PEPPER ?? '';
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password + pepper, salt);
    }
    if (dto.email) user.email = dto.email;
    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role;
    if (typeof dto.isActive !== 'undefined') user.isActive = !!dto.isActive;
    const saved = (await this.repo.save(user)) as unknown as User;
    return this.toDto(saved);
  }

  // New: remove
  async remove(id: string): Promise<{ success: boolean }> {
    const asNumber = Number(id);
    const res = await this.repo.delete(asNumber);
    return { success: res.affected && res.affected > 0 } as any;
  }
}
