import request from 'supertest';
import app from '../../src/main';

describe('Auth provider integration (minimal)', () => {
  it('POST /auth/login should return tokens', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'student@example.com', password: 'secret' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('POST /auth/refresh should return new access token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'some-refresh' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('POST /auth/refresh without token should return 400', async () => {
    await request(app)
      .post('/auth/refresh')
      .send({})
      .expect(400);
  });
});
