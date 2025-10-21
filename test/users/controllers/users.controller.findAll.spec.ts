// test/users/controllers/users.controller.findAll.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
import { makeUserEntity } from '../../factories/user.factory';
import { expectDtoMappedToEntity } from '../../utils/asserts';
describe('UsersController – findAll', () => {
  let controller: UsersController;
  const service = { findAll: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
  });

  it('GET /users → delega ao service.findAll com paginação e filtros', async () => {
    const query = {
      page: 2,
      limit: 5,
      q: 'ada',
      role: UserRole.ADMIN,
      is_active: true,
    };
    const user = makeUserEntity() as any;
    service.findAll.mockResolvedValue({
      data: [user],
      total: 1,
      page: 2,
      limit: 5,
    });
    const res = await controller.findAll(query as any);
    expect(service.findAll).toHaveBeenCalledWith(query);
    // Compare essential pagination fields and that returned data contains expected user
    expect(res).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 5 }),
    );
    expectDtoMappedToEntity(
      { id: user.id, email: user.email } as any,
      res.data[0] as any,
      ['id', 'email'],
    );
  });
});
