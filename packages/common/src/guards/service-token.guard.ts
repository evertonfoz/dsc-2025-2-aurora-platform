import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['x-service-token'] || req.headers['X-Service-Token'];
    const token = Array.isArray(header) ? header[0] : header;
    const expected = process.env.SERVICE_TOKEN;
    // If server is configured with the insecure default token, refuse and ask
    // operator to set a real secret. This prevents accepting the shipped
    // example secret by accident.
    const insecureDefault = 'change-me-to-a-strong-secret';
    if (!expected || expected === insecureDefault) {
      // Do not echo the token value in logs.
      // Fail closed: require a proper SERVICE_TOKEN in the environment.
      throw new HttpException('Service token not configured properly', HttpStatus.UNAUTHORIZED);
    }

    if (String(token) !== String(expected)) {
      throw new HttpException('Service token required', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}
