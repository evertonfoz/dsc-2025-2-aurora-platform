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
});
