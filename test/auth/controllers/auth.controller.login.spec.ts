import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController – login', () => {
  let controller: AuthController;
  const service = { login: jest.fn() };
  const jwt = { verify: jest.fn(), sign: jest.fn() };

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        { provide: 'JwtService', useValue: jwt },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    controller = mod.get(AuthController);
    jest.clearAllMocks();
  });

  it('POST /auth/login → delega ao service.login', async () => {
    service.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const body = { email: 'ok@example.com', password: 'secret' } as any;
    const req: any = { headers: { 'user-agent': 'ua' } };
    const res = await controller.login(body, '1.2.3.4', req);
    expect(service.login).toHaveBeenCalledWith(body.email, body.password, '1.2.3.4', 'ua');
    expect(res).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });
});
