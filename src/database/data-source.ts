// src/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config(); // carrega .env antes de ler process.env

const url = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  url
    ? {
        type: 'postgres',
        url,
        entities: [__dirname + '/../**/*.entity.{ts,js}'],
        migrations: [__dirname + '/migrations/*.{ts,js}'],
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        entities: [__dirname + '/../**/*.entity.{ts,js}'],
        migrations: [__dirname + '/migrations/*.{ts,js}'],
      }
);