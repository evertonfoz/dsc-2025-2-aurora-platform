import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1699740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS events`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS users`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Em ambiente de laboratório/ensino podemos dropar com CASCADE.
    await queryRunner.query(`DROP SCHEMA IF EXISTS auth CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS events CASCADE`);
  }
}
