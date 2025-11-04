import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Placeholder JWT guard.
 *
 * This file is intentionally minimal: it documents the recommended wiring with
 * @nestjs/passport and passport-jwt. If you use Passport, replace this with
 * `AuthGuard('jwt')` from `@nestjs/passport` and configure the strategy.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  // Preserve the previous dev behavior: when NODE_ENV !== 'production', inject a fake
  // user so existing unit tests and development flows continue to work.
  // In production, delegate to Passport's AuthGuard('jwt').
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Development helper: only auto-inject a fake user when explicitly enabled.
    // This prevents unintentional bypass of auth during local development.
    // Enable by setting DEV_AUTO_AUTH=true in your env (default: disabled).
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
        return super.canActivate(context) as boolean | Promise<boolean>;
      }

      // Only auto-inject a fake user if DEV_AUTO_AUTH is explicitly set to 'true'.
      if ((process.env.DEV_AUTO_AUTH ?? 'false').toLowerCase() === 'true') {
        request.user = { sub: 1, isAdmin: true, roles: ['admin'] };
        return true;
      }

      // No auth header and auto-auth disabled: deny access (behave like production).
      return false;
    }
    // AuthGuard returns boolean | Promise<boolean> | Observable<boolean>
    return super.canActivate(context) as boolean | Promise<boolean>;
  }
}
