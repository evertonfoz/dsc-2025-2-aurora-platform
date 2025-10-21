import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { LogoutDto } from './dtos/logout.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly jwt: JwtService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Ip() ip: string, @Req() req: any) {
    const ua = req?.headers?.['user-agent'];
    // Em produção, considere definir o refresh em cookie httpOnly (além do body).
    return this.auth.login(dto.email, dto.password, ip, ua);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Ip() ip: string, @Req() req: any) {
    const ua = req?.headers?.['user-agent'];
    // Se desejar, você pode aceitar refresh também via cookie httpOnly aqui.
    return this.auth.refresh(dto.refreshToken, ip, ua);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  async me(@Headers('authorization') authz?: string) {
    if (!authz?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authz.slice('Bearer '.length);

    // Verifica assinatura e extrai payload (sub = userId)
    let payload: any;
    try {
      payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const userId = Number(payload?.sub);
    if (!userId) throw new UnauthorizedException('Invalid token payload');

    return this.auth.me(userId);
  }
}
 
