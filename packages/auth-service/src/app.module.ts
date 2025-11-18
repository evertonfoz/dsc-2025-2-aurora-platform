import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { AuthModule } from './auth.module';

config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'db',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'postgres',
      database: process.env.DB_NAME ?? 'aurora_db',
      schema: process.env.DB_SCHEMA ?? 'auth',
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      extra: { options: `-c search_path=${process.env.DB_SCHEMA ?? 'auth'}` },
    }),
    AuthModule,
  ],
})
export class AppModule {}
