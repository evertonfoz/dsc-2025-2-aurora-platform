// packages/events-service/src/data-source.ts
// DataSource específico do package para rodar migrations localmente com
// `npx typeorm-ts-node-commonjs -d packages/events-service/src/data-source.ts migration:run`
// Arquivo preparado para fins didáticos: usa variáveis de ambiente do projeto

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

const port = parseInt(process.env.DB_PORT ?? '5432', 10);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'aurora_users',
  // Define explicit default schema for this DataSource. This helps ensure
  // TypeORM creates its migrations table and other objects in the intended
  // schema even when the connection's search_path is not set as expected.
  schema: process.env.DB_SCHEMA ?? 'public',
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  // Em dev/test mantemos synchronize:false e usamos migrations
  synchronize: false,
  migrationsRun: false,
  logging: process.env.DB_LOGGING === 'true',
  // Força o search_path para o schema desejado (útil durante migrations)
  extra: {
    options: `-c search_path=${process.env.DB_SCHEMA ?? 'public'}`,
  },
});
