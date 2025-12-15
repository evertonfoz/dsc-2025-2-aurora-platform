import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule, TokenRevocationGuard } from '@aurora/common';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { UsersHttpClient } from './users-http.client';
import { AuthController } from './auth.controller';
import { AuthTokenRevocationValidator } from './token-revocation.validator';
import { HealthController } from './health.controller';

@Module({
  imports: [
    CommonModule,
    // In test environment avoid registering TypeORM feature modules to prevent
    // loading DB-specific entities (tests may run without Postgres).
    ...(process.env.NODE_ENV === 'test' ? [] : [TypeOrmModule.forFeature([RefreshToken])]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: { expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN) ?? 900 },
    }),
  ],
  controllers: [AuthController, HealthController],
  providers: [
    // Provide a simple in-memory mock repository for tests so DI resolves
    ...(process.env.NODE_ENV === 'test'
      ? ([
          ({
            provide: 'RefreshTokenRepository',
            useValue: {
              create: (obj: any) => obj,
              save: async (entity: any) => ({ id: 1, ...entity }),
              find: async () => [],
            },
          } as unknown) as Provider,
        ] as Provider[])
      : []),
    AuthService,
    JwtStrategy,
    UsersHttpClient,
    AuthTokenRevocationValidator,
    {
      provide: 'TokenRevocationValidator',
      useExisting: AuthTokenRevocationValidator,
    },
    TokenRevocationGuard,
  ],
  // UsersHttpClient provides HTTP calls to the users service. Register it
  // here so AuthService can inject it.
  // Keep export of AuthService for other modules if needed.
  exports: [AuthService],
})
export class AuthModule {}
