import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsTable1699740001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'events_state_enum') THEN
          CREATE TYPE events.events_state_enum AS ENUM ('draft', 'published', 'archived');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'events_visibility_enum') THEN
          CREATE TYPE events.events_visibility_enum AS ENUM ('public', 'private');
        END IF;
      END$$;
    `);

    // Create events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events.events (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) NOT NULL,
        title VARCHAR(180) NOT NULL,
        summary VARCHAR(280) NOT NULL,
        description TEXT NOT NULL,
        state events.events_state_enum NOT NULL DEFAULT 'draft',
        visibility events.events_visibility_enum NOT NULL DEFAULT 'public',
        "startsAt" TIMESTAMPTZ NOT NULL,
        "endsAt" TIMESTAMPTZ NOT NULL,
        "registrationOpensAt" TIMESTAMPTZ NULL,
        "registrationClosesAt" TIMESTAMPTZ NULL,
        capacity INT NULL,
        "bannerUrl" VARCHAR(512) NULL,
        "coverUrl" VARCHAR(512) NULL,
        "ownerUserId" INT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events.events (slug)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events.events ("startsAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_state_visibility ON events.events (state, visibility)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS events.events CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS events.events_visibility_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS events.events_state_enum`);
  }
}
