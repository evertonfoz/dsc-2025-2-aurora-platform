import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureSingleUsersEmailUniqueIndex1758049174211
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop any known duplicate unique constraints/indexes if present
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS \"UQ_97672ac88f789774dd47f7c8be3\";`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS \"UQ_97672ac88f789774dd47f7c8be3\";`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS users_email_key;`);

    // Ensure the canonical named constraint exists
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS idx_users_email_unique;`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS idx_users_email_unique UNIQUE (email);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate a generic users_email_key constraint on down
    await queryRunner.query(
      `ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS idx_users_email_unique;`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE (email);`,
    );
  }
}
