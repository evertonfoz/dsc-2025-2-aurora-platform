import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';
import { User } from '../../../src/users/entities/user.entity';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
import { CreateUserDto } from '../../../src/users/dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password',
        role: UserRole.STUDENT,
      };

      const entity = {
        name: 'Test User',
        email: 'test@test.com',
        passwordHash: 'hashed-password',
        role: UserRole.STUDENT,
        avatarUrl: null,
      };
      const saved = { ...entity, id: 1 };
      repository.findOne.mockResolvedValue(null);
      // mocka o hash da senha
      jest
        .spyOn<any, any>(service as any, 'hash')
        .mockResolvedValue('hashed-password');
      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(entity);
      expect(repository.save).toHaveBeenCalledWith(entity);
      expect(result).toMatchObject({
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        role: UserRole.STUDENT,
      });
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw a conflict exception if the user already exists', async () => {
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password',
        role: UserRole.STUDENT,
      };

      // Simula usuário já existente
      repository.findOne.mockResolvedValue({ id: 1, ...dto });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
