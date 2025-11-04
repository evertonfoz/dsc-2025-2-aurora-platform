import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController – me', () => {
  let controller: AuthController;
  const service = { me: jest.fn() };
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

  it('GET /auth/me → verifica token e delega a service.me', async () => {
    jwt.verify.mockReturnValue({ sub: '7' });
    service.me.mockResolvedValue({ id: 7, email: 'ok@example.com' });
    const res = await controller.me('Bearer token');
    expect(jwt.verify).toHaveBeenCalled();
    expect(service.me).toHaveBeenCalledWith(7);
    expect(res).toEqual({ id: 7, email: 'ok@example.com' });
  });

  it('GET /auth/me → lança quando sem Bearer', async () => {
    await expect(controller.me(undefined)).rejects.toThrow();
  });

  it('GET /auth/me → lança quando token inválido', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('bad');
    });
    await expect(controller.me('Bearer bad')).rejects.toThrow();
  });
});
