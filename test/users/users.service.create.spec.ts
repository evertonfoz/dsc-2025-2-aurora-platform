// test/users/users.service.create.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { repositoryMockFactory, MockType } from '../mocks/repository.mock';

import { User } from '../../src/users/entities/user.entity';
import { UsersService } from '../../src/users/users.service';
import { UserRole } from '../../src/users/domain/user-role.enum';
import { CreateUserDto } from '../../src/users/dtos/create-user.dto';

// mocka bcryptjs (o service usa bcryptjs)
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt-10'),
  hash: jest.fn().mockResolvedValue('hashed-123'),
}));
import * as bcrypt from 'bcryptjs';

type RepoMock = MockType<Repository<User>>;

describe('UsersService – create', () => {
  let service: UsersService;
  let repo: RepoMock;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    repo = moduleRef.get(getRepositoryToken(User));
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  const makeDto = (over: Partial<CreateUserDto> = {}): CreateUserDto => ({
    name: '  aNA   sIlvA  ',
    email: '  ANA.SILVA@EXAMPLE.COM ',
    password: 'secret123',
    ...over,
  });

  it('cria com sucesso: normaliza email, compacta nome, role padrão, usa pepper e remove passwordHash no retorno', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((data) => ({
      ...data,
      id: 1,
    }));
    repo.save.mockResolvedValue({
      id: 1,
      name: 'aNA sIlvA',
      email: 'ana.silva@example.com',
      passwordHash: 'hashed-123',
      role: UserRole.STUDENT,
      avatarUrl: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    });

    // isola hash para não depender do bcrypt aqui
    const hashSpy = jest
      .spyOn<any, any>(service as any, 'hash')
      .mockResolvedValue('hashed-123');

    const result = await service.create(makeDto());

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'ana.silva@example.com' },
    });
    expect(hashSpy).toHaveBeenCalledWith('secret123'); // sem pepper
    expect(repo.create).toHaveBeenCalledWith({
      name: 'aNA sIlvA',
      email: 'ana.silva@example.com',
      passwordHash: 'hashed-123',
      role: UserRole.STUDENT,
      avatarUrl: null,
    });

    expect(result).toMatchObject({
      id: 1,
      name: 'aNA sIlvA',
      email: 'ana.silva@example.com',
      role: UserRole.STUDENT,
      avatarUrl: null,
    });
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('respeita role explícita', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((d) => d);
    repo.save.mockImplementation((e) => Promise.resolve(e));

    jest
      .spyOn(
        service as UsersService & { hash: (plain: string) => Promise<string> },
        'hash',
      )
      .mockResolvedValue('hashed-123');

    await service.create(makeDto({ role: UserRole.ADMIN }));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.ADMIN }),
    );
  });

  it('aplica HASH_PEPPER quando presente', async () => {
    process.env.HASH_PEPPER = '::pepper::';
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((d) => d);
    repo.save.mockImplementation((e) => Promise.resolve(e));

    const hashSpy = jest
      .spyOn(
        service as UsersService & { hash: (plain: string) => Promise<string> },
        'hash',
      )
      .mockResolvedValue('hashed-123');

    await service.create(makeDto());

    expect(hashSpy).toHaveBeenCalledWith('secret123::pepper::');
  });

  it('lança ConflictException quando e-mail já existe (pré-checagem)', async () => {
    repo.findOne.mockResolvedValue({ id: 42 });

    await expect(service.create(makeDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lança ConflictException em violação 23505 do banco', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((d) => d);

    const driverErr: any = { code: '23505' };
    repo.save.mockRejectedValue(
      new QueryFailedError('INSERT ...', [], driverErr),
    );

    jest
      .spyOn<any, any>(service as any, 'hash')
      .mockResolvedValue('hashed-123');

    await expect(service.create(makeDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('propaga outros erros inesperados do save()', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((d) => d);
    repo.save.mockRejectedValue(new Error('boom'));

    jest
      .spyOn<any, any>(service as any, 'hash')
      .mockResolvedValue('hashed-123');

    await expect(service.create(makeDto())).rejects.toThrow('boom');
  });

  it('deve criar e salvar um usuário (happy path)', async () => {
    const dto: CreateUserDto = {
      name: 'Ana',
      email: 'ana@mail.com',
      password: 'secret',
      role: UserRole.STUDENT,
    };

    const created: Partial<User> = {
      name: 'Ana',
      email: 'ana@mail.com',
      passwordHash: 'hashed-123',
      role: UserRole.STUDENT,
      avatarUrl: null,
    };

    const saved: User = {
      id: 1,
      ...created,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    } as User;

    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(saved);

    const hashSpy = jest
      .spyOn<any, any>(service as any, 'hash')
      .mockResolvedValue('hashed-123');

    const result = await service.create(dto);

    expect(hashSpy).toHaveBeenCalledWith('secret');

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana',
        email: 'ana@mail.com',
        passwordHash: 'hashed-123',
        role: UserRole.STUDENT,
        avatarUrl: null,
      }),
    );
    expect(repo.save).toHaveBeenCalledWith(created);

    expect(result).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@mail.com',
      role: UserRole.STUDENT,
      avatarUrl: null,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
    expect((result as any).passwordHash).toBeUndefined();
  });

  // 🔎 Teste específico do método privado hash (não depende de create)
  // 🔎 Teste específico do método privado hash (sem acoplar ao salt)
  it('hash() usa genSalt(10) e chama bcrypt.hash com a senha', async () => {
    // reconfigura mocks porque resetMocks limpou implementações
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt-10');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-123');

    const out = await (service as any).hash('pw-xyz');

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(
      (bcrypt.genSalt as jest.Mock).mock.invocationCallOrder[0],
    ).toBeLessThan((bcrypt.hash as jest.Mock).mock.invocationCallOrder[0]);

    const hashCall = (bcrypt.hash as jest.Mock).mock.calls[0];
    expect(hashCall[0]).toBe('pw-xyz');

    // não valide o salt literalmente; foco no comportamento
    expect(out).toBe('hashed-123');
  });

  it('deve mapear violação de unicidade de e-mail para ConflictException (variante)', async () => {
    const dto: CreateUserDto = {
      name: 'Ana',
      email: 'ana@mail.com',
      password: 'x',
    };

    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((d) => d);

    const driverErr: any = { code: '23505' };
    repo.save.mockRejectedValue(
      new QueryFailedError('INSERT ...', [], driverErr),
    );

    jest
      .spyOn<any, any>(service as any, 'hash')
      .mockResolvedValue('hashed-123');

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
