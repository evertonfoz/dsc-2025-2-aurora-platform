import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../../../src/common/guards/roles.guard';

describe('RolesGuard', () => {
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  } as any;

  const guard = new RolesGuard(mockReflector);

  function makeContext(user?: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => (user ? { user } : {}) }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('allows when no roles metadata is present', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const ok = guard.canActivate(makeContext());
    expect(ok).toBe(true);
  });

  it('allows when roles metadata is empty array', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const ok = guard.canActivate(makeContext());
    expect(ok).toBe(true);
  });

  it('denies when user is missing or has no roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const ok = guard.canActivate(makeContext());
    expect(ok).toBe(false);
  });

  it('allows when user has required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const ok = guard.canActivate(makeContext({ roles: ['admin'] }));
    expect(ok).toBe(true);
  });

  it('allows when any required role matches user roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['teacher', 'admin']);
    const ok = guard.canActivate(makeContext({ roles: ['teacher'] }));
    expect(ok).toBe(true);
  });
});
