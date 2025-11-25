import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['x-service-token'] || req.headers['X-Service-Token'];
    const token = Array.isArray(header) ? header[0] : header;
    const expected = process.env.SERVICE_TOKEN;
    if (!expected || String(token) !== String(expected)) {
      throw new UnauthorizedException('Service token required');
    }
    return true;
  }
}
