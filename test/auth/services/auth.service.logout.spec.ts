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

describe('AuthService.logout (unit)', () => {
  let service: AuthService;
  let repo: MockType<Repository<RefreshToken>>;
  let usersClient: Partial<UsersHttpClient>;
  let jwt: Partial<JwtService>;

  beforeEach(async () => {
    repo = repositoryMockFactory<RefreshToken>();

    usersClient = {
      validateUser: jest.fn(async () => null),
      getById: jest.fn(async () => null),
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

  it('logout should revoke the matching token', async () => {
    const raw = 'logout-raw';
    const token = makeRefreshTokenEntity({ userId: 1 }) as RefreshToken;
    token.tokenHash = await argon2.hash(raw);
    repo.find.mockResolvedValue([token]);
    repo.save.mockImplementation(async (e: any) => ({ id: token.id, ...e }));

    const r = await service.logout(raw);
    expect(r).toEqual({ revoked: 1 });

    expect(repo.find).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
