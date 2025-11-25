import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastLogoutAtToUsers1761000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    // Only add the column if users table exists in the current schema
    const has = await q.hasTable('users');
    if (has) {
      await q.addColumn(
        'users',
        new TableColumn({
          name: 'last_logout_at',
          type: 'timestamp with time zone',
          isNullable: true,
        }),
      );
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.dropColumn('users', 'last_logout_at');
  }
}
