import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
// Use runtime require for ConfigModule to avoid TS named-export resolution issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ConfigModule } = require('@nestjs/config');
import Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().default('development'),
        PORT: Joi.number().default(3010),
        DB_HOST: Joi.string().default('db'),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().default('postgres'),
        DB_PASS: Joi.string().default('postgres'),
        DB_NAME: Joi.string().default('aurora_db'),
        DB_SCHEMA: Joi.string().default('auth'),
        DB_LOGGING: Joi.string().valid('true', 'false').default('false'),
        SERVICE_TOKEN: Joi.string().required(),
        USERS_API_URL: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .default('http://users-service:3011'),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().optional(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('900'),
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const schema = config.get<string>('DB_SCHEMA') ?? 'auth';
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
          // Include public schema in search_path for extensions
          extra: { options: `-c search_path=${schema},public` },
        };
      },
    }),
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
