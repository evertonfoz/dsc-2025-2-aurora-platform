import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableCitextAndUsersEmailCitext1729090000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // enable citext extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext;`);

    // If there's a unique constraint/index on email, drop it first (the original migration created it as unique column)
    // We'll try to drop any unique index named users_email_key or idx_users_email if exists, then alter column type
    // If users table exists, drop any existing email constraint/index and migrate column to citext
    // Wrap all changes in a single DO block so the migration is safe when the users table is not yet present.
    await queryRunner.query(
      `DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
            ALTER TABLE users DROP CONSTRAINT users_email_key;
          END IF;
          IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_idx') THEN
            DROP INDEX users_email_idx;
          END IF;

          -- Alter column to citext
          EXECUTE 'ALTER TABLE users ALTER COLUMN email TYPE citext';

          -- Recreate unique constraint on email if needed
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
            ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
          END IF;
        END IF;
      END$$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint, alter column back to varchar, and (optionally) drop extension
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;`,
    );

    await queryRunner.query(
      `ALTER TABLE users ALTER COLUMN email TYPE varchar(160);`,
    );

    // It's generally safe to keep the extension if other objects might use it; do not drop by default.
    // If desired, uncomment the next line to drop the extension when rolling back.
    // await queryRunner.query(`DROP EXTENSION IF EXISTS citext;`);
  }
}
