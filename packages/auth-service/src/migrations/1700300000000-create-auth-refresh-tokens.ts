import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthRefreshTokens1700300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Garante que o schema exista (idempotente)
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth.auth_refresh_tokens (
        id SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "tokenHash" varchar(255) NOT NULL,
        "issuedAt" timestamptz NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "revokedAt" timestamptz NULL,
        "replacedByTokenId" integer NULL,
        ip varchar(45) NULL,
        "userAgent" varchar(255) NULL,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_auth_refresh_userid ON auth.auth_refresh_tokens ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_auth_refresh_expires ON auth.auth_refresh_tokens ("expiresAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS auth.auth_refresh_tokens CASCADE`,
    );
  }
}
