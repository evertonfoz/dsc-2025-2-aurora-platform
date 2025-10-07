// test/users/users.controller.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { UserRole } from '../../src/users/domain/user-role.enum';

describe('UsersController', () => {
  let controller: UsersController;

  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
  });

  it('POST /users → delega ao service.create', async () => {
    const body = {
      name: 'Ada',
      email: 'ada@mail.com',
      password: 'x',
      role: UserRole.TEACHER,
    };
    service.create.mockResolvedValue({ id: 1, ...body }); // retorno dummy
    await controller.create(body as any);
    expect(service.create).toHaveBeenCalledWith(body);
  });

  it('GET /users → delega ao service.findAll com paginação e filtros (q, role, is_active)', async () => {
    const query = {
      page: 2,
      limit: 5,
      q: 'ada',
      role: UserRole.ADMIN,
      is_active: true,
    };
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
    });
    const res = await controller.findAll(query as any);
    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(res).toEqual({ data: [], total: 0, page: 2, limit: 5 }); // já mapeado para DTO na controller
  });
  it('GET /users/:id → delega ao service.findOne e retorna o usuário mapeado para DTO', async () => {
    const user = {
      id: 42,
      name: 'Grace Hopper',
      email: 'grace@navy.mil',
      passwordHash: 'hash',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    service.findOne.mockResolvedValue(user);
    const res = await controller.findOne('42');
    expect(service.findOne).toHaveBeenCalledWith(42);
    expect(res).toMatchObject({
      id: 42,
      name: 'Grace Hopper',
      email: 'grace@navy.mil',
      role: UserRole.ADMIN,
      isActive: true,
    });
    expect(res).not.toHaveProperty('passwordHash');
  });

  it('GET /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.findOne.mockResolvedValue(undefined);
    await expect(controller.findOne('999')).rejects.toThrow('Usuário não encontrado.');
    expect(service.findOne).toHaveBeenCalledWith(999);
  });
  it('PUT /users/:id → delega ao service.update e retorna o usuário atualizado', async () => {
    const updateDto = {
      name: 'Alan Turing',
      email: 'alan@turing.com',
      password: 'novaSenha',
      role: UserRole.TEACHER,
    };
    const updatedUser = {
      id: 7,
      name: 'Alan Turing',
      email: 'alan@turing.com',
      role: UserRole.TEACHER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    service.update.mockResolvedValue(updatedUser);
    const res = await controller.update('7', updateDto as any);
    expect(service.update).toHaveBeenCalledWith(7, updateDto);
    expect(res).toMatchObject({
      id: 7,
      name: 'Alan Turing',
      email: 'alan@turing.com',
      role: UserRole.TEACHER,
      isActive: true,
    });
  });

  it('PUT /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.update.mockResolvedValue(undefined);
    await expect(controller.update('999', {} as any)).rejects.toThrow('Usuário não encontrado.');
    expect(service.update).toHaveBeenCalledWith(999, {});
  });
  it('PATCH /users/:id → delega ao service.update e retorna o usuário atualizado', async () => {
    const patchDto = { name: 'Joan Clarke' };
    const patchedUser = {
      id: 8,
      name: 'Joan Clarke',
      email: 'joan@bombe.com',
      role: UserRole.STUDENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    service.update.mockResolvedValue(patchedUser);
    const res = await controller.patch('8', patchDto as any);
    expect(service.update).toHaveBeenCalledWith(8, patchDto);
    expect(res).toMatchObject({
      id: 8,
      name: 'Joan Clarke',
      email: 'joan@bombe.com',
      role: UserRole.STUDENT,
      isActive: true,
    });
  });

  it('PATCH /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.update.mockResolvedValue(undefined);
    await expect(controller.patch('999', {} as any)).rejects.toThrow('Usuário não encontrado.');
    expect(service.update).toHaveBeenCalledWith(999, {});
  });
  it('DELETE /users/:id → delega ao service.remove e retorna success true', async () => {
    service.remove.mockResolvedValue(true);
    const res = await controller.remove('5');
    expect(service.remove).toHaveBeenCalledWith(5);
    expect(res).toEqual({ success: true });
  });

  it('DELETE /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.remove.mockResolvedValue(false);
    await expect(controller.remove('999')).rejects.toThrow('Usuário não encontrado.');
    expect(service.remove).toHaveBeenCalledWith(999);
  });
});
