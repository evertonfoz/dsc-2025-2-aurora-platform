import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * JWT guard with proper error handling for 401 responses.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: { sub: number; isAdmin: boolean; roles?: string[] };
      }
    >();

    const authHeader = request.get?.('authorization') ?? '';

    if (process.env.NODE_ENV !== 'production') {
      // If there's an Authorization header, delegate to Passport so a real token
      // is validated even in dev.
      if (authHeader?.startsWith('Bearer ')) {
        try {
          return (await super.canActivate(context)) as boolean;
        } catch (err) {
          // Re-throw any authentication errors
          throw new UnauthorizedException('Invalid or missing authentication token');
        }
      }

      // Only auto-inject a fake user if DEV_AUTO_AUTH is explicitly set to 'true'.
      if ((process.env.DEV_AUTO_AUTH ?? 'false').toLowerCase() === 'true') {
        request.user = { sub: 1, isAdmin: true, roles: ['admin'] };
        return true;
      }

      // No auth header and auto-auth disabled: deny access
      throw new UnauthorizedException('Missing or invalid authentication token');
    }

    // In production, always validate via Passport
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
  }
}
