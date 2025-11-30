import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersHttpClient } from '../users-http.client';

export interface AuthUser {
  sub: number; // id do usuário (int do BD)
  email: string;
  roles: string[]; // ex.: ['student'] | ['teacher'] | ['admin']
}

export type AccessTokenPayload = AuthUser & {
  iat: number;
  exp: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Optional() private readonly config?: ConfigService,
    private readonly users?: UsersHttpClient,
  ) {
    const resolvedSecret =
      config?.get<string>('JWT_ACCESS_SECRET') ?? process.env.JWT_ACCESS_SECRET;

    if (!resolvedSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'JwtStrategy requires JWT_ACCESS_SECRET when running in production',
        );
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: resolvedSecret ?? 'dev_access_secret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthUser> {
    const { sub, email, roles, iat } = payload;

    // if users client available, check lastLogoutAt
    if (this.users) {
      try {
        const u = await this.users.getById(sub);

        if (u?.lastLogoutAt) {
          const last = Date.parse(u.lastLogoutAt) / 1000; // seconds

          if (iat <= last) {
            throw new UnauthorizedException('Token revoked (user logged out)');
          }
        }
      } catch (err) {
        // if client fails, be conservative and allow (or revoke?). We'll treat failure as a pass.
        if (err instanceof UnauthorizedException) {
          throw err; // re-throw auth errors
        }
      }
    }

    return { sub, email, roles: Array.isArray(roles) ? roles : [] };
  }
}
