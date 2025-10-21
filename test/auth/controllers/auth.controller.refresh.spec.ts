import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController – refresh', () => {
  let controller: AuthController;
  const service = { refresh: jest.fn() };
  const jwt = { verify: jest.fn() };

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    controller = mod.get(AuthController);
    jest.clearAllMocks();
  });

  it('POST /auth/refresh → delega ao service.refresh', async () => {
    service.refresh.mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' });
    const body = { refreshToken: 'tok' } as any;
  const req: any = { get: (k: string) => (k === 'user-agent' ? 'ua2' : undefined) };
    const res = await controller.refresh(body, '5.6.7.8', req);
    expect(service.refresh).toHaveBeenCalledWith(body.refreshToken, '5.6.7.8', 'ua2');
    expect(res).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
  });
});
