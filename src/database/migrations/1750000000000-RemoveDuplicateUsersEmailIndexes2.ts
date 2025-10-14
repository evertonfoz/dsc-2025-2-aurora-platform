import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateUsersEmailIndexes21750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure the desired named constraint exists
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS idx_users_email_unique;`);
    await queryRunner.query(`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS idx_users_email_unique UNIQUE (email);`);

  // Drop common duplicate unique indexes if they exist
  await queryRunner.query(`DROP INDEX IF EXISTS "UQ_97672ac88f789774dd47f7c8be3";`);
  await queryRunner.query(`DROP INDEX IF EXISTS users_email_key;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create a generic previous constraint and remove the named one
    await queryRunner.query(`ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS idx_users_email_unique;`);
    await queryRunner.query(`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE (email);`);
  }
}
