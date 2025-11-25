import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersHttpClient } from './users-http.client';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: { expiresIn: 900 },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersHttpClient, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
