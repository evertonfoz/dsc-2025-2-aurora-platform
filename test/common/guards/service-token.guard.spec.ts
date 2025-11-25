import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ServiceTokenGuard } from '../../../src/common/guards/service-token.guard';

describe('ServiceTokenGuard', () => {
  const guard = new ServiceTokenGuard();

  function makeContextWithHeader(header?: Record<string, unknown>) {
    const req: Record<string, unknown> = { headers: header ?? {} };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext & { _req?: Record<string, unknown> };
  }

  it('throws when SERVICE_TOKEN not configured or insecure default', () => {
    const prev = process.env.SERVICE_TOKEN;
    delete process.env.SERVICE_TOKEN;
    const context = makeContextWithHeader();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    process.env.SERVICE_TOKEN = prev;
  });

  it('throws when header missing even if SERVICE_TOKEN configured', () => {
    const prev = process.env.SERVICE_TOKEN;
    process.env.SERVICE_TOKEN = 's3cr3t-token';
    const context = makeContextWithHeader();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    process.env.SERVICE_TOKEN = prev;
  });

  it('throws when header present but invalid', () => {
    const prev = process.env.SERVICE_TOKEN;
    process.env.SERVICE_TOKEN = 's3cr3t-token';
    const context = makeContextWithHeader({ 'x-service-token': 'wrong' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    process.env.SERVICE_TOKEN = prev;
  });

  it('returns true when header matches SERVICE_TOKEN and injects user', () => {
    const prev = process.env.SERVICE_TOKEN;
    process.env.SERVICE_TOKEN = 's3cr3t-token';
    const context = makeContextWithHeader({
      'x-service-token': 's3cr3t-token',
    });
    expect(guard.canActivate(context)).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toBeDefined();
    expect(req.user.sub).toBe(0);
    expect(req.user.roles).toContain('admin');
    process.env.SERVICE_TOKEN = prev;
  });
});
