import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Placeholder JWT guard.
 *
 * This file is intentionally minimal: it documents the recommended wiring with
 * @nestjs/passport and passport-jwt. If you use Passport, replace this with
 * `AuthGuard('jwt')` from `@nestjs/passport` and configure the strategy.
 */

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // Implement JWT validation here or use `@nestjs/passport` AuthGuard('jwt')
    // Mark _context as used for linting purposes.
    void _context;
    // Returning true for now as a placeholder.
    return true;
  }
}
