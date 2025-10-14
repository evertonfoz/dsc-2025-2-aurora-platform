import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersHttpClient } from './users-http.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '900' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersHttpClient],
  exports: [AuthService],
})
export class AuthModule {}
