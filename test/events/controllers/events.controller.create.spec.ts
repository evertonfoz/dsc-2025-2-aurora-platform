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
  const service = { create: jest.fn() } as unknown as Partial<EventsService>;

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
    const saved = makeEventEntity({ id: 1 });
    saved.title = body.title;
    (service.create as jest.Mock).mockResolvedValue(
      saved as import('../../../src/events/entities/event.entity').Event,
    );

    const res = await controller.create(body, 123);

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: body.title }),
      123,
    );
    expectDtoMappedToEntity(
      { id: 1, title: body.title } as Partial<Record<string, unknown>>,
      res as unknown as Record<string, unknown>,
      ['id', 'title'],
    );
    expectNoSensitiveFields(res as unknown as Record<string, unknown>);
  });
});
