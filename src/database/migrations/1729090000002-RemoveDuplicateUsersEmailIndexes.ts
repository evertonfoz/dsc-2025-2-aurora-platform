import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateUsersEmailIndexes1729090000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the named index if it doesn't exist
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email_unique') THEN
        BEGIN
          PERFORM 1;
        END;
      END IF;
    END$$;`);

    // Ensure idx_users_email_unique exists (create as constraint to keep consistent naming)
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS idx_users_email_unique;`,
    );
    // Older Postgres versions don't support `ADD CONSTRAINT IF NOT EXISTS`.
    // Create a named unique index instead (idempotent with IF NOT EXISTS).
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email);`,
    );

    // Drop any other UNIQUE indexes on users(email) except the one we want
    await queryRunner.query(`DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'users'
          AND indexdef ILIKE '%(email)%'
          AND indexdef ILIKE '%UNIQUE%'
          AND indexname <> 'idx_users_email_unique'
      LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', r.indexname);
      END LOOP;
    END$$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate a generic users_email_key constraint and remove the named idx
    // Remove the named index if it exists
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_users_email_unique;`,
    );
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
