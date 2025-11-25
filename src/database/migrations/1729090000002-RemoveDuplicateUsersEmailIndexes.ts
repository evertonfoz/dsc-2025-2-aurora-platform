import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateUsersEmailIndexes1729090000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    -- Make operations schema-aware and safe: check current_schema for users
    await queryRunner.query(`DO $$
    DECLARE r RECORD;
      users_reg regclass;
    BEGIN
      users_reg := to_regclass(current_schema() || '.users');
      IF users_reg IS NOT NULL THEN
        -- Ensure idx_users_email_unique exists in current schema
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_users_email_unique') THEN
          EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I.%I (email)', 'idx_users_email_unique', current_schema(), 'users');
        END IF;

        -- Drop any other UNIQUE indexes on current_schema.users(email) except the one we want
        FOR r IN
          SELECT indexname FROM pg_indexes
          WHERE schemaname = current_schema() AND tablename = 'users'
            AND indexdef ILIKE '%(email)%'
            AND indexdef ILIKE '%UNIQUE%'
            AND indexname <> 'idx_users_email_unique'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I.%I', current_schema(), r.indexname);
        END LOOP;
      END IF;
    END$$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the named index if it exists and recreate generic constraint only if users exists
    await queryRunner.query(`DO $$
    DECLARE r RECORD;
      users_reg regclass;
    BEGIN
      users_reg := to_regclass(current_schema() || '.users');
      IF users_reg IS NOT NULL THEN
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', current_schema(), 'idx_users_email_unique');

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          WHERE tc.table_schema = current_schema() AND tc.table_name = 'users' AND tc.constraint_type = 'UNIQUE' AND tc.constraint_name = 'users_email_key'
        ) THEN
          EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT users_email_key UNIQUE (email)', current_schema(), 'users');
        END IF;
      END IF;
    END$$;`);
  }
}
