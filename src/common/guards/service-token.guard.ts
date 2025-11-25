import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: { sub: number; roles: string[]; isAdmin: boolean };
    }>();
    const header = req.headers['x-service-token'] ?? req.headers['X-Service-Token'];
    const token = Array.isArray(header) ? header[0] : header;
    const expected = process.env.SERVICE_TOKEN;
    const insecureDefault = 'change-me-to-a-strong-secret';
    if (!expected || expected === insecureDefault) {
      throw new UnauthorizedException('Service token not configured properly');
    }
    if (String(token) !== String(expected)) {
      throw new UnauthorizedException('Service token required');
    }
    if (!req.user) {
      req.user = {
        sub: 0,
        roles: ['admin', 'teacher', 'student'],
        isAdmin: true,
      };
    }
    return true;
  }
}
