import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let repo: Partial<Record<keyof Repository<User>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => ({ id: 1, ...d })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('create should save user and return dto', async () => {
    const dto = { email: 'a@b.com', name: 'A', password: 'p' };
    const res = await service.create(dto as any);
    expect(res).toHaveProperty('email', 'a@b.com');
  });

  it('remove should return success true', async () => {
    const res = await service.remove('1');
    expect(res).toEqual({ success: true });
  });
});
