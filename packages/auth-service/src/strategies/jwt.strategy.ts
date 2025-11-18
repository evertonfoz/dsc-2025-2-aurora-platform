import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
  constructor(@Optional() private readonly config?: ConfigService) {
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

  validate(payload: AccessTokenPayload): AuthUser {
    const { sub, email, roles } = payload;
    return { sub, email, roles: Array.isArray(roles) ? roles : [] };
  }
}
