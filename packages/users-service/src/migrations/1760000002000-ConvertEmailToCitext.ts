import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertEmailToCitext1760000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ensure extension exists in public schema (accessible from all schemas)
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;`,
    );

    // alter column type to citext in the users schema
    // search_path now includes public schema, so citext type is found
    await queryRunner.query(`
      ALTER TABLE users.users
      ALTER COLUMN email TYPE citext USING email::citext;
    `);

    // ensure a unique index exists on email (case-insensitive)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'users' AND indexname = 'idx_users_email_unique'
        ) THEN
          CREATE UNIQUE INDEX idx_users_email_unique ON users.users (email);
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // revert column type back to varchar(160)
    await queryRunner.query(`
      ALTER TABLE users.users
      ALTER COLUMN email TYPE varchar USING email::varchar;
    `);

    // drop the unique index if exists
    await queryRunner.query(`
      DROP INDEX IF EXISTS users.idx_users_email_unique;
    `);
  }
}
