// packages/users-service/src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

const port = parseInt(process.env.DB_PORT ?? '5432', 10);
const schema = process.env.DB_SCHEMA ?? 'users';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'db',
  port,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'aurora_db',
  schema,
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  migrationsRun: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: {
    // Include public schema in search_path for citext extension
    options: `-c search_path=${schema},public`,
  },
});
