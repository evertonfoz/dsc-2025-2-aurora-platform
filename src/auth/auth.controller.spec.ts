import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };
  const mockJwt = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call auth.login with ip and ua on POST /auth/login', async () => {
    mockAuthService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const dto = { email: 'a@b.com', password: 'secret' };
    const req: any = { headers: { 'user-agent': 'ua' } };
    const res = await controller.login(dto as any, '1.2.3.4', req);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto.email, dto.password, '1.2.3.4', 'ua');
    expect(res).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('should call auth.refresh with ip and ua on POST /auth/refresh', async () => {
    mockAuthService.refresh.mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' });
    const dto = { refreshToken: 'tok' };
    const req: any = { headers: { 'user-agent': 'ua2' } };
    const res = await controller.refresh(dto as any, '5.6.7.8', req);
    expect(mockAuthService.refresh).toHaveBeenCalledWith(dto.refreshToken, '5.6.7.8', 'ua2');
    expect(res).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
  });

  it('should call auth.logout on POST /auth/logout', async () => {
    mockAuthService.logout.mockResolvedValue({ revoked: 1 });
    const dto = { refreshToken: 'tok' };
    const res = await controller.logout(dto as any);
    expect(mockAuthService.logout).toHaveBeenCalledWith(dto.refreshToken);
    expect(res).toEqual({ revoked: 1 });
  });

  it('should return me when bearer token valid', async () => {
    mockJwt.verify.mockReturnValue({ sub: '42' });
    mockAuthService.me.mockResolvedValue({ id: 42, email: 'a@b.com' });
    const res = await controller.me('Bearer token');
    expect(mockJwt.verify).toHaveBeenCalled();
    expect(mockAuthService.me).toHaveBeenCalledWith(42);
    expect(res).toEqual({ id: 42, email: 'a@b.com' });
  });

  it('should throw when no bearer token on /me', async () => {
    await expect(controller.me(undefined as any)).rejects.toThrow();
  });

  it('should throw when invalid token on /me', async () => {
    mockJwt.verify.mockImplementation(() => { throw new Error('bad'); });
    await expect(controller.me('Bearer badtoken')).rejects.toThrow();
  });
});
