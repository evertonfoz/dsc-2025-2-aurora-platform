import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (unit)', () => {
  let controller: AuthController;
  const service = { login: jest.fn(), refresh: jest.fn(), logout: jest.fn(), me: jest.fn() };
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

  it('POST /auth/login should delegate to service.login', async () => {
    service.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const body = { email: 'ok@example.com', password: 'secret' } as any;
    const req: any = { headers: { 'user-agent': 'ua' } };
    const res = await controller.login(body, '1.2.3.4', req);
    expect(service.login).toHaveBeenCalledWith(body.email, body.password, '1.2.3.4', 'ua');
    expect(res).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('POST /auth/refresh should delegate to service.refresh', async () => {
    service.refresh.mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' });
    const body = { refreshToken: 'tok' } as any;
    const req: any = { headers: { 'user-agent': 'ua2' } };
    const res = await controller.refresh(body, '5.6.7.8', req);
    expect(service.refresh).toHaveBeenCalledWith(body.refreshToken, '5.6.7.8', 'ua2');
    expect(res).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
  });

  it('POST /auth/logout should delegate to service.logout', async () => {
    service.logout.mockResolvedValue({ revoked: 1 });
    const body = { refreshToken: 'tok' } as any;
    const res = await controller.logout(body);
    expect(service.logout).toHaveBeenCalledWith(body.refreshToken);
    expect(res).toEqual({ revoked: 1 });
  });

  it('GET /auth/me should verify token and call service.me', async () => {
    jwt.verify.mockReturnValue({ sub: '7' });
    service.me.mockResolvedValue({ id: 7, email: 'ok@example.com' });
    const res = await controller.me('Bearer token');
    expect(jwt.verify).toHaveBeenCalled();
    expect(service.me).toHaveBeenCalledWith(7);
    expect(res).toEqual({ id: 7, email: 'ok@example.com' });
  });
});
