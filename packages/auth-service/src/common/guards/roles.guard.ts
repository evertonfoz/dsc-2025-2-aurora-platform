import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // Scaffold stub: allow all requests. Replace with role checks in real service.
    return true;
  }
}
