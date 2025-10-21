// test/users/controllers/users.controller.remove.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
// removed unused import expectNoSensitiveFields
describe('UsersController – remove', () => {
  let controller: UsersController;
  const service = { remove: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
  });

  it('DELETE /users/:id → delega ao service.remove e retorna success true', async () => {
    service.remove.mockResolvedValue(true);
    const res = await controller.remove('5');
    expect(service.remove).toHaveBeenCalledWith(5);
    expect(res).toEqual({ success: true });
  });

  it('DELETE /users/:id → lança NotFoundException se usuário não existe', async () => {
    service.remove.mockResolvedValue(false);
    await expect(controller.remove('999')).rejects.toThrow(
      'Usuário não encontrado.',
    );
    expect(service.remove).toHaveBeenCalledWith(999);
  });
});
