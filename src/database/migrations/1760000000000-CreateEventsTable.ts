import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsTable1760000000000 implements MigrationInterface {
  name = 'CreateEventsTable1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "event_state_enum" AS ENUM('draft', 'published', 'archived')
    `);
    await queryRunner.query(`
      CREATE TYPE "event_visibility_enum" AS ENUM('public', 'private')
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" SERIAL NOT NULL,
        "slug" character varying(255) NOT NULL,
        "title" character varying(180) NOT NULL,
        "summary" character varying(280) NOT NULL,
        "description" text NOT NULL,
        "state" "event_state_enum" NOT NULL DEFAULT 'draft',
        "visibility" "event_visibility_enum" NOT NULL DEFAULT 'public',
        "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "registrationOpensAt" TIMESTAMP WITH TIME ZONE,
        "registrationClosesAt" TIMESTAMP WITH TIME ZONE,
        "capacity" integer,
        "bannerUrl" character varying(512),
        "coverUrl" character varying(512),
        "ownerUserId" integer NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
      )
    `);

    // Create unique constraint
    await queryRunner.query(`
      ALTER TABLE "events" ADD CONSTRAINT "UQ_events_slug" UNIQUE ("slug")
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_events_starts_at" ON "events" ("startsAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_events_state_visibility" ON "events" ("state", "visibility")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_events_state_visibility"`);
    await queryRunner.query(`DROP INDEX "IDX_events_starts_at"`);

    // Drop constraint
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "UQ_events_slug"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "events"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "event_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "event_state_enum"`);
  }
}