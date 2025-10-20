import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../../../src/auth/entities/refresh-token.entity';
import { AuthModule } from '../../../src/auth/auth.module';

// Load .env so tests inherit the same DB config
require('dotenv').config();

// Increase default Jest timeout because establishing DB connection may take a few seconds
jest.setTimeout(30000);

describe('Auth RefreshToken repository (postgres smoke)', () => {
  it('deve resolver o Repository<RefreshToken> usando Postgres', async () => {
    const mod = await Test.createTestingModule({
      imports: [
        // Explicit Postgres options using .env values so the driver is always defined
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT ?? '5432', 10),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASS || 'postgres',
          database: process.env.DB_NAME || 'aurora_users',
          entities: [RefreshToken],
          synchronize: false,
          logging: false,
        }),
        AuthModule,
      ],
    }).compile();

    const repo = mod.get(getRepositoryToken(RefreshToken));
    expect(repo).toBeDefined();

    // Close the testing module to ensure DB connections are properly closed
    await mod.close();
  });
});
