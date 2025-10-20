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
    // Older Postgres versions don't support `ADD CONSTRAINT IF NOT EXISTS`.
    // Create a named unique index instead (idempotent with IF NOT EXISTS).
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate a generic users_email_key constraint on down
    // Remove the named index if it exists
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email_unique;`);
    // Optionally recreate a generic unique constraint (keep compatibility with previous schema expectations)
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'users' AND tc.constraint_type = 'UNIQUE' AND tc.constraint_name = 'users_email_key'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
      END IF;
    END$$;`);
  }
}
