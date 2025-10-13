// test/users/controllers/users.controller.update.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/domain/user-role.enum';
import { UpdateUserDto } from '../../../src/users/dtos/update-user.dto';
describe('UsersController – update', () => {
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
    const res = await controller.update('7', updateDto as UpdateUserDto);
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
    await expect(controller.update('999', {} as UpdateUserDto)).rejects.toThrow(
      'Usuário não encontrado.',
    );
    expect(service.update).toHaveBeenCalledWith(999, {});
  });
});
