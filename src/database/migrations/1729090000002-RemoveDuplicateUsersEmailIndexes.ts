import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateUsersEmailIndexes1729090000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only perform index/constraint operations if users table exists
    await queryRunner.query(`DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Ensure idx_users_email_unique exists
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email_unique') THEN
          -- Create a named unique index (idempotent with IF NOT EXISTS)
          EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (email)';
        END IF;

        -- Drop any other UNIQUE indexes on users(email) except the one we want
        PERFORM (
          SELECT 1 FROM (
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'users'
              AND indexdef ILIKE '%(email)%'
              AND indexdef ILIKE '%UNIQUE%'
              AND indexname <> 'idx_users_email_unique'
          ) t
        );

        FOR r IN
          SELECT indexname FROM pg_indexes
          WHERE tablename = 'users'
            AND indexdef ILIKE '%(email)%'
            AND indexdef ILIKE '%UNIQUE%'
            AND indexname <> 'idx_users_email_unique'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', r.indexname);
        END LOOP;
      END IF;
    END$$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the named index if it exists and recreate generic constraint only if users exists
    await queryRunner.query(`DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'DROP INDEX IF EXISTS idx_users_email_unique';

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          WHERE tc.table_name = 'users' AND tc.constraint_type = 'UNIQUE' AND tc.constraint_name = 'users_email_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        END IF;
      END IF;
    END$$;`);
  }
}
