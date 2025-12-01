import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Auth provider integration (minimal)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
