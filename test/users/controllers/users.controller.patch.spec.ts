// test/users/controllers/users.controller.patch.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/domain/user-role.enum';
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
});