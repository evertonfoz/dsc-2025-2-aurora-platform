import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { UsersHttpClient } from './users-http.client';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: { expiresIn: 900 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UsersHttpClient],
  // UsersHttpClient provides HTTP calls to the users service. Register it
  // here so AuthService can inject it.
  // Keep export of AuthService for other modules if needed.
  exports: [AuthService],
})
export class AuthModule {}
