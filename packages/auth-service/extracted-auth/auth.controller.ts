import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { LogoutDto } from './dtos/logout.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Ip() ip: string, @Req() req: Request) {
    const ua = req.get('user-agent') ?? undefined;
    return this.auth.login(dto.email, dto.password, ip, ua);
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const ua = req.get('user-agent') ?? undefined;
    return this.auth.refresh(dto.refreshToken, ip, ua);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async me(@Headers('authorization') authz?: string) {
    if (!authz?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authz.slice('Bearer '.length);
    let payload: unknown;
    try {
      payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('sub' in payload)
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const sub = (payload as { sub?: unknown }).sub;
    if (typeof sub !== 'string' && typeof sub !== 'number') {
      throw new UnauthorizedException('Invalid token payload');
    }
    const userId = Number(sub);
    if (Number.isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return this.auth.me(userId);
  }
}
