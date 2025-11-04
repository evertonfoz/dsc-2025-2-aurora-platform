// test/users/controllers/users.controller.update.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
import { makeUserEntity } from '../../factories/user.factory';
import {
  expectDtoMappedToEntity,
  expectNoSensitiveFields,
} from '../../utils/asserts';
describe('UsersController – update', () => {
  let controller: UsersController;
  const service = { update: jest.fn() } as { update: jest.Mock };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
  });

  it('PUT /users/:id → delega ao service.update e retorna o usuário atualizado', async () => {
    const updateDto = {
      name: 'Alan Turing',
      email: 'alan@turing.com',
      password: 'novaSenha',
      role: UserRole.TEACHER,
    };
    const updatedUser: Partial<
      import('../../../src/users/entities/user.entity').User
    > = makeUserEntity({
      id: 7,
      name: 'Alan Turing',
      email: 'alan@turing.com',
      role: UserRole.TEACHER,
    });
    service.update.mockResolvedValue(updatedUser);
    const res = await controller.update('7', updateDto as unknown as Record<string, unknown>, undefined as unknown as number, undefined);
    expect(service.update).toHaveBeenCalledWith(7, updateDto);
    expectDtoMappedToEntity(
      {
        id: 7,
        name: 'Alan Turing',
        email: 'alan@turing.com',
        role: UserRole.TEACHER,
        isActive: true,
      } as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
      ['id', 'name', 'email', 'role', 'isActive'],
    );
    expectNoSensitiveFields(res as unknown as Record<string, unknown>);
  });

  it('PUT /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.update.mockResolvedValue(undefined);
    await expect(controller.update('999', {} as unknown as Record<string, unknown>, undefined as unknown as number, undefined)).rejects.toThrow('Usuário não encontrado.');
    expect(service.update).toHaveBeenCalledWith(999, {});
  });
});
