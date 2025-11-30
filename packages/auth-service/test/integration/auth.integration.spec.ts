import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { AuthModule } from '../../src/auth.module';

describe('Auth provider integration (minimal)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('aurora_db')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    // Create the auth schema
    const { Client } = await import('pg');
    const client = new Client({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    });
    await client.connect();
    await client.query('CREATE SCHEMA IF NOT EXISTS auth');
    await client.end();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          database: container.getDatabase(),
          username: container.getUsername(),
          password: container.getPassword(),
          schema: 'auth',
          entities: [__dirname + '/../../src/**/*.entity.{ts,js}'],
          migrations: [__dirname + '/../../src/migrations/*.{ts,js}'],
          migrationsRun: true,
          synchronize: false,
          extra: { options: '-c search_path=auth' },
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    await app?.close();
    await container?.stop();
  });

  it('POST /auth/login with invalid credentials should return 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('POST /auth/login without email should return 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: 'secret' })
      .expect(400);
  });

  it('POST /auth/refresh with invalid token should return 400 or 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-token' });
    
    // Either 400 (validation) or 401 (auth) is acceptable
    expect([400, 401]).toContain(res.status);
  });

  it('POST /auth/refresh without token should return 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);
  });
});
