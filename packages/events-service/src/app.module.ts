import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule, JwtStrategy } from '@aurora/common';
import { EventsModule } from './events.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().default('development'),
        PORT: Joi.number().default(3012),
        DB_HOST: Joi.string().default('db'),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().default('postgres'),
        DB_PASS: Joi.string().default('postgres'),
        DB_NAME: Joi.string().default('aurora_db'),
        DB_SCHEMA: Joi.string().default('events'),
        DB_LOGGING: Joi.string().valid('true', 'false').default('false'),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('900'),
        SERVICE_TOKEN: Joi.string().required(),
        RATE_LIMIT_TTL: Joi.number().default(60),
        RATE_LIMIT_LIMIT: Joi.number().default(100),
        CORS_ORIGIN: Joi.string().optional(),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: (Number(config.get<number>('RATE_LIMIT_TTL')) ?? 60) * 1000, // Convert seconds to milliseconds for v6
          limit: Number(config.get<number>('RATE_LIMIT_LIMIT')) ?? 100,
        }],
      }),
    }),
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
        signOptions: { expiresIn: Number(config.get<string>('JWT_ACCESS_EXPIRES_IN')) ?? 900 },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const schema = config.get<string>('DB_SCHEMA') ?? 'events';
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST') ?? 'db',
          port: Number(config.get<number>('DB_PORT') ?? 5432),
          username: config.get<string>('DB_USER') ?? 'postgres',
          password: config.get<string>('DB_PASS') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'aurora_db',
          schema,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*.{ts,js}'],
          migrationsRun: true,
          synchronize: false,
          logging: config.get<string>('DB_LOGGING') === 'true',
          // Include public schema in search_path for citext extension
          extra: { options: `-c search_path=${schema},public` },
        };
      },
    }),
    EventsModule,
  ],
  controllers: [HealthController],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
