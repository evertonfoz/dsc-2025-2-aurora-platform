import { Test } from '@nestjs/testing';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';
import {
  makeCreateEventDto,
  makeEventEntity,
} from '../../factories/event.factory';
import {
  expectDtoMappedToEntity,
  expectNoSensitiveFields,
} from '../../utils/asserts';

describe('EventsController – create', () => {
  let controller: EventsController;
  const service = { create: jest.fn() } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(EventsController);
    jest.clearAllMocks();
  });

  it('POST /events → delega ao service.create e retorna o evento criado', async () => {
    const body = makeCreateEventDto();
    const saved = makeEventEntity({ id: 1, ...body } as any) as any;
    service.create.mockResolvedValue(saved);

    const res = await controller.create(body as any, 123);

    expect(service.create).toHaveBeenCalledWith(body, 123);
    expectDtoMappedToEntity({ id: 1, title: body.title } as any, res as any, [
      'id',
      'title',
    ]);
    expectNoSensitiveFields(res as any);
  });
});
