import { Test } from '@nestjs/testing';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';
import { makeEventEntity } from '../../factories/event.factory';
describe('EventsController – find', () => {
  let controller: EventsController;
  const service: jest.Mocked<Partial<EventsService>> = {
    findAll: jest.fn(),
    findOneByIdOrSlug: jest.fn(),
  } as unknown as jest.Mocked<Partial<EventsService>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(EventsController);
    jest.clearAllMocks();
  });

  it('GET /events → delega findAll e retorna resultado', async () => {
    (service.findAll as jest.Mock).mockResolvedValue({
      events: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const res = await controller.findAll(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(res).toHaveProperty('events');
  });

  it('GET /events/:idOrSlug numeric → delega findOneByIdOrSlug com number', async () => {
    const e5 = makeEventEntity({ id: 5 });
    (service.findOneByIdOrSlug as jest.Mock).mockResolvedValue(
      e5 as unknown as import('../../../src/events/entities/event.entity').Event,
    );

    const res = await controller.findOne('5');

    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith(5);
    // only assert the id to avoid comparing full entity (timestamps and generated fields)
    expect(res).toMatchObject({ id: 5 });
  });

  it('GET /events/:idOrSlug slug → delega findOneByIdOrSlug com slug', async () => {
    const e6 = makeEventEntity({ id: 6 });
    (service.findOneByIdOrSlug as jest.Mock).mockResolvedValue(
      e6 as unknown as import('../../../src/events/entities/event.entity').Event,
    );

    const res = await controller.findOne('my-slug');

    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith('my-slug');
    // only assert the id to avoid comparing full entity (timestamps and generated fields)
    expect(res).toMatchObject({ id: 6 });
  });
});
