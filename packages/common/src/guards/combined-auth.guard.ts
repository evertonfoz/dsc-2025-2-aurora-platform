import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ServiceTokenGuard } from './service-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CombinedAuthGuard extends AuthGuard('jwt') implements CanActivate {
  private readonly serviceGuard = new ServiceTokenGuard();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // try service token first
    try {
      const ok = await this.serviceGuard.canActivate(context);
      if (ok) return true;
    } catch (err) {
      // ignore and try jwt
    }

    // fallback to jwt guard
    const jwtResult = super.canActivate(context);
    if (jwtResult instanceof Promise) {
      return jwtResult;
    } else if (typeof jwtResult === 'boolean') {
      return jwtResult;
    } else {
      // Observable
      return lastValueFrom(jwtResult);
    }
  }
}
