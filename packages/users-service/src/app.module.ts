import './polyfill-crypto';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CommonModule, JwtStrategy } from '@aurora/common';

config();

@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'db',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASS ?? 'postgres',
        database: process.env.DB_NAME ?? 'aurora_db',
        schema: process.env.DB_SCHEMA ?? 'users',
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        synchronize: false,
        logging: process.env.DB_LOGGING === 'true',
        extra: { options: `-c search_path=${process.env.DB_SCHEMA ?? 'users'}` },
      }),
    }),
    UsersModule,
  ],
  providers: [],
  // Validate service tokens via guard - exported from common module.
})
export class AppModule {}
