import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUsersEmailUniqueIndex1729090000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop common constraint/index names that could exist, then create a named unique constraint
    await queryRunner.query(`ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_email_key;`);
    await queryRunner.query(`DROP INDEX IF EXISTS users_email_idx;`);

    // Create named unique constraint
    await queryRunner.query(`ALTER TABLE users ADD CONSTRAINT idx_users_email_unique UNIQUE (email);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: drop the named constraint and recreate the previous (unnamed) constraint with the historical name
    await queryRunner.query(`ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS idx_users_email_unique;`);

    // Restore previous constraint name used before (if desired)
    await queryRunner.query(`ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);`);
  }
}
