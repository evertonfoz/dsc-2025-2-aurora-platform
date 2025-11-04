import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';

describe('JwtAuthGuard (dev behavior)', () => {
  const guard = new JwtAuthGuard();

  function makeContext() {
    const req: Record<string, unknown> = {};
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext & { _req?: Record<string, unknown> };
  }

  it('injects a fake user when NODE_ENV !== production', () => {
    const prev = process.env.NODE_ENV;
    const prevAuto = process.env.DEV_AUTO_AUTH;
    process.env.NODE_ENV = 'test';
    process.env.DEV_AUTO_AUTH = 'true';
    const context = makeContext();
    const ok = guard.canActivate(context as ExecutionContext);
    // guard returns true in dev/test
    expect(ok).toBe(true);
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    expect(user).toBeDefined();
    expect(typeof user.sub).toBe('number');
    // restore
    process.env.NODE_ENV = prev;
    process.env.DEV_AUTO_AUTH = prevAuto;
  });
});
