import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1699740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Schemas are now created by postgres-init/01-create-db-and-schemas.sql
    // This migration is kept for backwards compatibility and idempotency
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS events`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Em ambiente de laboratório/ensino podemos dropar com CASCADE.
    await queryRunner.query(`DROP SCHEMA IF EXISTS events CASCADE`);
  }
}
