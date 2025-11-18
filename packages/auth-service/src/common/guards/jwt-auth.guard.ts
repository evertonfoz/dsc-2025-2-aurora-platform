import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: { sub: number; isAdmin: boolean; roles?: string[] };
      }
    >();

    const authHeader = request.get?.('authorization') ?? '';

    if (process.env.NODE_ENV !== 'production') {
      if (authHeader?.startsWith('Bearer ')) {
        return super.canActivate(context) as boolean | Promise<boolean>;
      }

      if ((process.env.DEV_AUTO_AUTH ?? 'false').toLowerCase() === 'true') {
        request.user = { sub: 1, isAdmin: true, roles: ['admin'] };
        return true;
      }

      return false;
    }
    return super.canActivate(context) as boolean | Promise<boolean>;
  }
}
