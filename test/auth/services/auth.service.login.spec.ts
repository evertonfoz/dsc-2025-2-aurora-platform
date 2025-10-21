import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { AuthService } from '../../../src/auth/auth.service';
import { RefreshToken } from '../../../src/auth/entities/refresh-token.entity';
import { UsersHttpClient } from '../../../src/auth/users-http.client';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';

describe('AuthService.login (unit)', () => {
  let service: AuthService;
  let repo: MockType<Repository<RefreshToken>>;
  let usersClient: Partial<UsersHttpClient>;
  let jwt: Partial<JwtService>;

  beforeEach(async () => {
    repo = repositoryMockFactory<RefreshToken>();

    usersClient = {
      validateUser: jest.fn(async (email: string, password: string) => {
        if (email === 'ok@example.com' && password === 'secret') {
          return { id: 1, email, name: 'Ok', roles: ['user'] };
        }
        return null;
      }),
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

  it('login should return access and refresh for valid credentials', async () => {
    // repo.save should return the saved entity with id
    repo.save.mockImplementation(async (e: any) => ({ id: 1, ...e }));
    repo.create.mockImplementation((e: any) => ({ ...e }));
    repo.find.mockResolvedValue([]);

    const res = await service.login('ok@example.com', 'secret', '1.2.3.4', 'jest');
    expect(res).toHaveProperty('accessToken', 'signed-access-token');
    expect(res).toHaveProperty('refreshToken');
    expect(res.user).toMatchObject({ id: 1, email: 'ok@example.com' });

    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
