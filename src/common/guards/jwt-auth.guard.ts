import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

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
  canActivate(context: ExecutionContext): any {
    if (process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest();
      // keep minimal shape used across the codebase
      request.user = { sub: 1, isAdmin: true, roles: ['admin'] };
      return true;
    }
    return super.canActivate(context);
  }
}
