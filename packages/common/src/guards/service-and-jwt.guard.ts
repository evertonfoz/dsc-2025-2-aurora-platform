import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceTokenGuard } from './service-token.guard';
import { lastValueFrom } from 'rxjs';

/**
 * Guard that requires BOTH a valid service token AND a valid JWT.
 * Use this for internal service-to-service calls that also need user context.
 */
@Injectable()
export class ServiceAndJwtGuard
  extends AuthGuard('jwt')
  implements CanActivate
{
  private readonly serviceGuard = new ServiceTokenGuard();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, validate service token (required)
    try {
      const serviceOk = await this.serviceGuard.canActivate(context);
      if (!serviceOk) {
        throw new UnauthorizedException('Service token required');
      }
    } catch (err) {
      // Re-throw service token errors
      throw err;
    }

    // Then, validate JWT (required)
    try {
      const jwtResult = super.canActivate(context);
      if (jwtResult instanceof Promise) {
        return await jwtResult;
      } else if (typeof jwtResult === 'boolean') {
        return jwtResult;
      } else {
        // Observable
        return await lastValueFrom(jwtResult);
      }
    } catch (err) {
      throw new UnauthorizedException('Valid JWT required');
    }
  }
}
