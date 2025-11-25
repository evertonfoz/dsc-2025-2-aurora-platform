import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Req,
  Post,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshDto } from './dtos/refresh.dto';
import { LogoutDto } from './dtos/logout.dto';
import { RolesGuard, TokenRevocationGuard } from '@aurora/common';

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
  @UseGuards(AuthGuard('jwt'), TokenRevocationGuard, RolesGuard)
  async me(@Req() req: Request) {
    // Passport JwtStrategy will populate request.user with the token payload
    const user = req.user as { sub?: number } | undefined;
    const userId = Number(user?.sub);
    if (!user || Number.isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return this.auth.me(userId);
  }
}
