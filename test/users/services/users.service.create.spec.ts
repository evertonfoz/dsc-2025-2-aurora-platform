import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';
import { User } from '../../../src/users/entities/user.entity';
import { UsersService } from '../../../src/users/users.service';
// removed unused imports UserRole and CreateUserDto
import {
  makeCreateUserDto,
  makeUserEntity,
} from '../../factories/user.factory';

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
      const dto = makeCreateUserDto({ password: 'password' });
      // ensure entity uses the same dto values (avoid internal seq mismatch)
      const entity = makeUserEntity({
        ...dto,
        passwordHash: 'hashed-password',
        id: 1,
      } as any) as any;
      repository.findOne.mockResolvedValue(null);
      // mocka o hash da senha
      jest
        .spyOn<any, any>(service as any, 'hash')
        .mockResolvedValue('hashed-password');
      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: entity.name, email: entity.email }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 1,
        name: entity.name,
        email: entity.email,
        role: entity.role,
      });
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw a conflict exception if the user already exists', async () => {
      const dto = makeCreateUserDto();
      // Simula usuário já existente
      repository.findOne.mockResolvedValue({ id: 1, ...dto });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
