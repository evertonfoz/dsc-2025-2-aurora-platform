import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';

import { AuthService } from '../../../src/auth/auth.service';
import { RefreshToken } from '../../../src/auth/entities/refresh-token.entity';
import { UsersHttpClient } from '../../../src/auth/users-http.client';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';
import { makeRefreshTokenEntity } from '../../factories/refresh-token.factory';

describe('AuthService.refresh (unit)', () => {
  let service: AuthService;
  let repo: MockType<Repository<RefreshToken>>;
  let usersClient: Partial<UsersHttpClient>;
  let jwt: Partial<JwtService>;

  beforeEach(async () => {
    repo = repositoryMockFactory<RefreshToken>();

    usersClient = {
      validateUser: jest.fn(async () => null),
      getById: jest.fn(async (id: number) => {
        if (id === 1) return { id: 1, email: 'ok@example.com', name: 'Ok', roles: ['user'] };
        return null;
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

  it('refresh should rotate token and return new pair', async () => {
    const raw = 'existing-raw-token';
    const token = makeRefreshTokenEntity({ userId: 1 }) as RefreshToken;
    token.tokenHash = await argon2.hash(raw);
    // repo.find should return the candidate
    repo.find.mockResolvedValue([token]);
    // when creating/saving new token
    repo.create.mockImplementation((e: any) => ({ ...e }));
    repo.save.mockImplementation(async (e: any) => ({ id: 2, ...e }));

    const res = await service.refresh(raw, '1.2.3.4', 'jest');
    expect(res).toHaveProperty('accessToken', 'signed-access-token');
    expect(res).toHaveProperty('refreshToken');

    expect(repo.find).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
