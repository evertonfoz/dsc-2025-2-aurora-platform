import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureSingleUsersEmailUniqueIndex1758049174211
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make all operations schema-aware and safe
    await queryRunner.query(`DO $$
    BEGIN
      IF to_regclass(current_schema() || '.users') IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', current_schema(), 'users', 'UQ_97672ac88f789774dd47f7c8be3');
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', current_schema(), 'users', 'users_email_key');
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', current_schema(), 'UQ_97672ac88f789774dd47f7c8be3');
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', current_schema(), 'users_email_key');

        -- Ensure the canonical named constraint/index exists
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', current_schema(), 'users', 'idx_users_email_unique');
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I.%I (email)', 'idx_users_email_unique', current_schema(), 'users');
      END IF;
    END$$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate a generic users_email_key constraint on down
    // Remove the named index if it exists
    await queryRunner.query(`DO $$
    BEGIN
      IF to_regclass(current_schema() || '.users') IS NOT NULL THEN
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
