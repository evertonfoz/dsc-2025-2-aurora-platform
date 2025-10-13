// test/users/controllers/users.controller.findOne.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/domain/user-role.enum';
describe('UsersController – findOne', () => {
  let controller: UsersController;
  const service = { findOne: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
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
    await expect(controller.findOne('999')).rejects.toThrow(
      'Usuário não encontrado.',
    );
    expect(service.findOne).toHaveBeenCalledWith(999);
  });
});
