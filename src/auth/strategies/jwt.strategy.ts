// src/auth/strategies/jwt.strategy.ts
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
    // Resolve secret explicitly so we can throw in production when missing.
    const resolvedSecret =
      config?.get<string>('JWT_ACCESS_SECRET') ?? process.env.JWT_ACCESS_SECRET;

    if (!resolvedSecret) {
      if (process.env.NODE_ENV === 'production') {
        // In production we want to fail fast if the secret is not configured.
        throw new Error(
          'JwtStrategy requires JWT_ACCESS_SECRET when running in production',
        );
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: resolvedSecret ?? 'dev_access_secret',
      ignoreExpiration: false,
      // Se você usa issuer/audience, descomente e configure no .env:
      // issuer: config.get<string>('JWT_ISSUER'),
      // audience: config.get<string>('JWT_AUDIENCE'),
    });
  }

  /**
   * É chamado automaticamente se a assinatura e a expiração forem válidas.
   * O valor retornado aqui vira `request.user` nos controllers/guards.
   */
  validate(payload: AccessTokenPayload): AuthUser {
    // Sanitiza e garante o shape canônico
    const { sub, email, roles } = payload;

    // (Opcional) Regras extras de sanidade:
    if (typeof sub !== 'number') {
      // Você pode lançar um UnauthorizedException aqui se desejar
      // mas, em geral, o token não deveria chegar até aqui errado.
    }

    return { sub, email, roles: Array.isArray(roles) ? roles : [] };
  }
}
