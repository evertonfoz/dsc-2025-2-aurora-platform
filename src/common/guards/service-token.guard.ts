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
    // If server is configured with the insecure default token, refuse and ask
    // operator to set a real secret. This prevents accepting the shipped
    // example secret by accident.
    const insecureDefault = 'change-me-to-a-strong-secret';
    if (!expected || expected === insecureDefault) {
      // Do not echo the token value in logs.
      // Fail closed: require a proper SERVICE_TOKEN in the environment.
      throw new UnauthorizedException('Service token not configured properly');
    }

    if (String(token) !== String(expected)) {
      throw new UnauthorizedException('Service token required');
    }

    // When service token is valid, inject a trusted internal service user
    // so subsequent guards (JwtAuthGuard, RolesGuard) see an authenticated admin.
    // This allows internal service-to-service calls to bypass individual JWT validation.
    if (!req.user) {
      req.user = {
        sub: 0, // special ID for internal service
        roles: ['admin', 'teacher', 'student'], // grant all roles for internal calls
        isAdmin: true,
      };
    }

    return true;
  }
}
