// test/users/controllers/users.controller.create.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
describe('UsersController – create', () => {
  let controller: UsersController;
  const service = { create: jest.fn() };

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
    service.create.mockResolvedValue({ id: 1, ...body });
    await controller.create(body as any);
    expect(service.create).toHaveBeenCalledWith(body);
  });
});
