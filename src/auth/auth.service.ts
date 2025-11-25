import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersHttpClient, UsersIdentity } from './users-http.client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

function nowUtc(): Date {
  return new Date();
}
function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly users: UsersHttpClient,
    // optional direct access to UsersService for internal updates (lastLogoutAt)
    @Optional()
    private readonly usersService?: import('../users/users.service').UsersService,
  ) {}

  // Assina access token curto e stateless
  private signAccess(user: UsersIdentity) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles ?? [],
    });
  }

  // Emite um novo refresh (hash persistido) e retorna par {raw, entity}
  private async issueRefresh(
    userId: number,
    ip?: string,
    userAgent?: string,
  ): Promise<{ raw: string; entity: RefreshToken }> {
    const raw = crypto.randomBytes(48).toString('base64url'); // ~64+ chars
    const tokenHash = await argon2.hash(raw);
    const entity = this.refreshRepo.create({
      userId,
      tokenHash,
      issuedAt: nowUtc(),
      expiresAt: addDays(Number(process.env.REFRESH_EXPIRES_DAYS ?? '7')),
      revokedAt: null,
      replacedByTokenId: null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });
    await this.refreshRepo.save(entity);
    return { raw, entity };
  }

  // LOGIN: valida no Users, emite access + refresh
  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.users.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.signAccess(user);
    const { raw: refreshToken } = await this.issueRefresh(
      user.id,
      ip,
      userAgent,
    );
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // REFRESH: verifica hash, revoga atual, cria novo e retorna novo access+refresh
  async refresh(refreshTokenRaw: string, ip?: string, userAgent?: string) {
    if (!refreshTokenRaw)
      throw new BadRequestException('Missing refresh token');

    // Busca candidatos não revogados e não expirados (ordem decrescente)
    const candidates = await this.refreshRepo.find({
      where: { revokedAt: IsNull(), expiresAt: MoreThan(nowUtc()) },
      order: { id: 'DESC' },
    });

    let current: RefreshToken | undefined;
    for (const t of candidates) {
      if (await argon2.verify(t.tokenHash, refreshTokenRaw)) {
        current = t;
        break;
      }
    }
    if (!current)
      throw new UnauthorizedException('Invalid or expired refresh token');

    // Rotação: cria novo e marca o atual como revogado apontando para o novo
    const { raw: newRaw, entity: newEntity } = await this.issueRefresh(
      current.userId,
      ip,
      userAgent,
    );
    current.revokedAt = nowUtc();
    current.replacedByTokenId = newEntity.id;
    await this.refreshRepo.save(current);

    const user = await this.users.getById(current.userId);
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.signAccess(user);
    return {
      accessToken,
      refreshToken: newRaw,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // LOGOUT: revoga o refresh atual
  async logout(refreshTokenRaw: string) {
    if (!refreshTokenRaw) return { revoked: 0 };

    const candidates = await this.refreshRepo.find({
      where: { revokedAt: IsNull(), expiresAt: MoreThan(nowUtc()) },
      order: { id: 'DESC' },
    });

    let current: RefreshToken | undefined;
    for (const t of candidates) {
      if (await argon2.verify(t.tokenHash, refreshTokenRaw)) {
        current = t;
        break;
      }
    }
    if (!current) return { revoked: 0 };

    current.revokedAt = nowUtc();
    await this.refreshRepo.save(current);

    // Update user's last logout timestamp so access tokens issued before
    // this moment are considered invalid by JwtStrategy.
    try {
      await this.usersService?.setLastLogoutAt(current.userId, nowUtc());
    } catch {
      // Non-fatal: best-effort update. Do not break logout if this fails.
    }

    return { revoked: 1 };
  }

  // ME: introspecção de identidade a partir do sub do access (feito no controller)
  async me(userId: number) {
    const user = await this.users.getById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles ?? [],
    };
  }
}

/*
Notes:
- This service expects controller to inject ip/user-agent and extract userId from access token.
- If missing dependency: npm i @nestjs/jwt argon2
- REFRESH_EXPIRES_DAYS defines refresh TTL (default 7 days).
*/
