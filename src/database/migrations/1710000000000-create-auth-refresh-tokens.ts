import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuthRefreshTokens1710000000000
  implements MigrationInterface
{
  name = 'CreateAuthRefreshTokens1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'userId', type: 'int', isNullable: false },
          {
            name: 'tokenHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          { name: 'issuedAt', type: 'timestamptz', isNullable: false },
          { name: 'expiresAt', type: 'timestamptz', isNullable: false },
          { name: 'revokedAt', type: 'timestamptz', isNullable: true },
          { name: 'replacedByTokenId', type: 'int', isNullable: true },
          { name: 'ip', type: 'varchar', length: '45', isNullable: true },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createIndex(
      'auth_refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'auth_refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_expires',
        columnNames: ['expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('auth_refresh_tokens', 'IDX_refresh_user');
    await queryRunner.dropIndex('auth_refresh_tokens', 'IDX_refresh_expires');
    await queryRunner.dropTable('auth_refresh_tokens');
  }
}
