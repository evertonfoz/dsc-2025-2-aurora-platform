import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLogoutAtColumn1760000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users.users
      ADD COLUMN IF NOT EXISTS last_logout_at timestamptz NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users.users
      DROP COLUMN IF EXISTS last_logout_at;
    `);
  }
}
