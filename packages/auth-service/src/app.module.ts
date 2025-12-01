import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { AuthModule } from './auth.module';

config();

const schema = process.env.DB_SCHEMA ?? 'auth';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'db',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'postgres',
      database: process.env.DB_NAME ?? 'aurora_db',
      schema,
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      migrationsRun: true,
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      // Include public schema in search_path for extensions
      extra: { options: `-c search_path=${schema},public` },
    }),
    AuthModule,
  ],
})
export class AppModule {}
