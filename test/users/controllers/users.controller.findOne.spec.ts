// test/users/controllers/users.controller.findOne.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
import { makeUserEntity } from '../../factories/user.factory';
import {
  expectDtoMappedToEntity,
  expectNoSensitiveFields,
} from '../../utils/asserts';
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
    const user: Partial<
      import('../../../src/users/entities/user.entity').User
    > = makeUserEntity({
      id: 42,
      name: 'Grace Hopper',
      email: 'grace@navy.mil',
      role: UserRole.ADMIN,
    });
    service.findOne.mockResolvedValue(user);
    const res = await controller.findOne('42');
    expect(service.findOne).toHaveBeenCalledWith(42);
    expectDtoMappedToEntity(
      {
        id: 42,
        name: 'Grace Hopper',
        email: 'grace@navy.mil',
        role: UserRole.ADMIN,
        isActive: true,
      } as Record<string, any>,
      res as Record<string, any>,
      ['id', 'name', 'email', 'role', 'isActive'],
    );
    expectNoSensitiveFields(res as Record<string, any>);
  });

  it('GET /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.findOne.mockResolvedValue(undefined);
    await expect(controller.findOne('999')).rejects.toThrow(
      'Usuário não encontrado.',
    );
    expect(service.findOne).toHaveBeenCalledWith(999);
  });
});
