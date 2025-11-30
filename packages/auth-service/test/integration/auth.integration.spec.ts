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

  it('POST /auth/login should return tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@example.com', password: 'secret' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('POST /auth/refresh should return new access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'some-refresh' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('POST /auth/refresh without token should return 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);
  });
});
