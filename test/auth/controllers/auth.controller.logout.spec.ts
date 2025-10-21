import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController – logout', () => {
  let controller: AuthController;
  const service = { logout: jest.fn() };
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

  it('POST /auth/logout → delega ao service.logout', async () => {
    service.logout.mockResolvedValue({ revoked: 1 });
    const body = { refreshToken: 'tok' } as any;
    const res = await controller.logout(body);
    expect(service.logout).toHaveBeenCalledWith(body.refreshToken);
    expect(res).toEqual({ revoked: 1 });
  });
});
