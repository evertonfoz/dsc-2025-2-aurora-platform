import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

interface User {
  sub: number;
  isAdmin: boolean;
}

/**
 * Placeholder JWT guard.
 *
 * This file is intentionally minimal: it documents the recommended wiring with
 * @nestjs/passport and passport-jwt. If you use Passport, replace this with
 * `AuthGuard('jwt')` from `@nestjs/passport` and configure the strategy.
 */

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // In DEV, inject fake user
    if (process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      request.user = { sub: 1, isAdmin: true };
    }
    // Implement JWT validation here or use `@nestjs/passport` AuthGuard('jwt')
    // Returning true for now as a placeholder.
    return true;
  }
}
