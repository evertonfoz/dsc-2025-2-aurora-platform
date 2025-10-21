import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { AuthService } from '../../../src/auth/auth.service';
import { RefreshToken } from '../../../src/auth/entities/refresh-token.entity';
import { UsersHttpClient } from '../../../src/auth/users-http.client';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';

describe('AuthService.me (unit)', () => {
  let service: AuthService;
  let repo: MockType<Repository<RefreshToken>>;
  let usersClient: Partial<UsersHttpClient>;
  let jwt: Partial<JwtService>;

  beforeEach(async () => {
    repo = repositoryMockFactory<RefreshToken>();

    usersClient = {
      validateUser: jest.fn(() => Promise.resolve(null)),
      getById: jest.fn((id: number) => {
        if (id === 1)
          return Promise.resolve({
            id: 1,
            email: 'ok@example.com',
            name: 'Ok',
            roles: ['user'],
          });
        return Promise.resolve(null);
      }),
    };

    jwt = {
      sign: jest.fn(() => 'signed-access-token'),
    };

    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(RefreshToken), useValue: repo },
        { provide: UsersHttpClient, useValue: usersClient },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = mod.get(AuthService);
  });

  it('me should return user identity', async () => {
    const u = await service.me(1);
    expect(u).toMatchObject({ id: 1, email: 'ok@example.com' });
  });
});
