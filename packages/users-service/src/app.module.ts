import './polyfill-crypto';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule, JwtStrategy } from '@aurora/common';
import { UsersModule } from './users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().default('development'),
        PORT: Joi.number().default(3011),
        DB_HOST: Joi.string().default('db'),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().default('postgres'),
        DB_PASS: Joi.string().default('postgres'),
        DB_NAME: Joi.string().default('aurora_db'),
        DB_SCHEMA: Joi.string().default('users'),
        DB_LOGGING: Joi.string().valid('true', 'false').default('false'),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        SERVICE_TOKEN: Joi.string().required(),
        RATE_LIMIT_TTL: Joi.number().default(60),
        RATE_LIMIT_LIMIT: Joi.number().default(100),
        CORS_ORIGIN: Joi.string().optional(),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: Number(config.get<number>('RATE_LIMIT_TTL')) ?? 60,
        limit: Number(config.get<number>('RATE_LIMIT_LIMIT')) ?? 100,
      }),
    }),
    CommonModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
        signOptions: { expiresIn: Number(config.get<string>('JWT_EXPIRES_IN')) ?? 900 },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const schema = config.get<string>('DB_SCHEMA') ?? 'users';
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST') ?? 'db',
          port: Number(config.get<number>('DB_PORT') ?? 5432),
          username: config.get<string>('DB_USER') ?? 'postgres',
          password: config.get<string>('DB_PASS') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'aurora_db',
          schema,
          entities: [__dirname + '/**/*.entity.{ts,js}'],
          migrations: [__dirname + '/migrations/*.{ts,js}'],
          migrationsRun: true,
          synchronize: false,
          logging: config.get<string>('DB_LOGGING') === 'true',
          // Include public schema in search_path for citext extension
          extra: { options: `-c search_path=${schema},public` },
        };
      },
    }),
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  // Validate service tokens via guard - exported from common module.
})
export class AppModule {}
