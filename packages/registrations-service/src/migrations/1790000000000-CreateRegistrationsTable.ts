import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegistrationsTable1790000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // create schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS registrations`);

    // create enum type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status_enum') THEN
          CREATE TYPE registrations.registration_status_enum AS ENUM (
            'pending', 'confirmed', 'cancelled', 'waitlist', 'attended', 'no_show'
          );
        END IF;
      END$$;
    `);

    // create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS registrations.registrations (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        status registrations.registration_status_enum NOT NULL DEFAULT 'pending',
        inscription_date TIMESTAMPTZ NOT NULL DEFAULT now(),
        cancellation_date TIMESTAMPTZ NULL,
        origin VARCHAR(50) NULL,
        check_in_done BOOLEAN NOT NULL DEFAULT false,
        check_in_date TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_user_event_unique ON registrations.registrations (user_id, event_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations.registrations (event_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations.registrations (user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS registrations.registrations CASCADE`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS registrations.registration_status_enum`,
    );
  }
}
