// test/users/controllers/users.controller.create.spec.ts
import { Test } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/enums/user-role.enum';
import { makeCreateUserDto, makeUserEntity } from '../../factories/user.factory';
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
    const body = makeCreateUserDto({ role: UserRole.TEACHER });
    const saved = makeUserEntity({ id: 1, ...body } as any) as any;
    service.create.mockResolvedValue(saved);
    await controller.create(body as any);
    expect(service.create).toHaveBeenCalledWith(body);
  });
});
