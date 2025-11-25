import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUsersEmailUniqueIndex1729090000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make operations safe and schema-aware
    await queryRunner.query(`DO $$
    DECLARE users_reg regclass;
    BEGIN
      users_reg := to_regclass(current_schema() || '.users');
      IF users_reg IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS users_email_key', current_schema(), 'users');
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', current_schema(), 'users_email_idx');

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_users_email_unique') THEN
          EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT idx_users_email_unique UNIQUE (email)', current_schema(), 'users');
        END IF;
      END IF;
    END$$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: drop the named constraint and recreate the previous (unnamed) constraint with the historical name
    await queryRunner.query(`DO $$
    DECLARE users_reg regclass;
    BEGIN
      users_reg := to_regclass(current_schema() || '.users');
      IF users_reg IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS idx_users_email_unique', current_schema(), 'users');
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
          EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT users_email_key UNIQUE (email)', current_schema(), 'users');
        END IF;
      END IF;
    END$$;`);
  }
}
