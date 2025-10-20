import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../src/auth/entities/refresh-token.entity';
import { AuthModule } from '../src/auth/auth.module';

describe('Auth RefreshToken repository (smoke)', () => {
  it('deve resolver o Repository<RefreshToken>', async () => {
    const mod = await Test.createTestingModule({
      imports: [
        // Use an in-memory SQLite DB for DI smoke test so we don't depend on Postgres
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [RefreshToken],
          synchronize: true,
          logging: false,
        }),
        AuthModule,
      ],
    }).compile();

    const repo = mod.get(getRepositoryToken(RefreshToken));
    expect(repo).toBeDefined();
  });
});
