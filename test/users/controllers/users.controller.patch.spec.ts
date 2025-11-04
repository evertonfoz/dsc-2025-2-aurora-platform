// test/users/controllers/users.controller.patch.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
import { makeUserEntity } from '../../factories/user.factory';
import {
  expectDtoMappedToEntity,
  expectNoSensitiveFields,
} from '../../utils/asserts';
describe('UsersController – patch', () => {
  let controller: UsersController;
  const service = { update: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
  });

  it('PATCH /users/:id → delega ao service.update e retorna o usuário atualizado', async () => {
    const patchDto = { name: 'Joan Clarke' };
    const patchedUser: Partial<import('../../../src/users/entities/user.entity').User> = makeUserEntity({
      id: 8,
      name: 'Joan Clarke',
      email: 'joan@bombe.com',
      role: UserRole.STUDENT,
    });
    service.update.mockResolvedValue(patchedUser);
    const res = await controller.patch('8', patchDto as Record<string, any>);
    expect(service.update).toHaveBeenCalledWith(8, patchDto);
    expectDtoMappedToEntity(
      {
        id: 8,
        name: 'Joan Clarke',
        email: 'joan@bombe.com',
        role: UserRole.STUDENT,
        isActive: true,
      } as Record<string, any>,
      res as Record<string, any>,
      ['id', 'name', 'email', 'role', 'isActive'],
    );
    expectNoSensitiveFields(res as Record<string, any>);
  });

  it('PATCH /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.update.mockResolvedValue(undefined);
    await expect(controller.patch('999', {} as Record<string, any>)).rejects.toThrow(
      'Usuário não encontrado.',
    );
    expect(service.update).toHaveBeenCalledWith(999, {});
  });
});
