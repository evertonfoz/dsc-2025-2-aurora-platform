import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // Lightweight guard for the scaffold: allow all requests.
    // In a real service replace with proper JWT validation logic.
    return true;
  }
}
