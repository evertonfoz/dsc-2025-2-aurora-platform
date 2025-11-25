import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Optional } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(@Optional() private readonly config?: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.get('authorization') ?? req.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7).trim();
    const secret = this.config?.get<string>('SERVICE_TOKEN_SECRET') ?? process.env.SERVICE_TOKEN_SECRET;
    const resolved = secret ?? 'dev_service_secret';

    try {
      const payload = jwt.verify(token, resolved) as any;
      // simple claim to ensure it's a service token
      if (!payload || !payload.service) throw new Error('not service token');
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid service token');
    }
  }
}
