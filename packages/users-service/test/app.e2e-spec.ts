import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../src/users/users.module';
import { User } from '../src/users/entities/user.entity';

describe('Users e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) creates and /users (GET) lists', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'int.user@example.com', name: 'Int User', password: 'p' })
      .expect(201);

    expect(create.body).toHaveProperty('email', 'int.user@example.com');

    const list = await request(app.getHttpServer()).get('/users').expect(200);
    expect(list.body).toHaveProperty('data');
    expect(Array.isArray(list.body.data)).toBeTruthy();
  });
});
