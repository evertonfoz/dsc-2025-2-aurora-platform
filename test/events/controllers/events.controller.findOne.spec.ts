import { Test } from '@nestjs/testing';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';
import { makeEventEntity } from '../../factories/event.factory';
import { expectDtoMappedToEntity } from '../../utils/asserts';

describe('EventsController – findOne', () => {
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
    const ev = makeEventEntity();
    (service.findAll as jest.Mock).mockResolvedValue({
      events: [ev],
      total: 1,
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
    expectDtoMappedToEntity(
      { id: ev.id, title: ev.title } as Partial<Record<string, unknown>>,
      res.events[0] as unknown as Record<string, unknown>,
      ['id', 'title'],
    );
  });

  it('GET /events/:idOrSlug numeric → delega findOneByIdOrSlug com number', async () => {
    const ev = makeEventEntity({ id: 5 });
    (service.findOneByIdOrSlug as jest.Mock).mockResolvedValue(
      ev as unknown as import('../../../src/events/entities/event.entity').Event,
    );

    const res = await controller.findOne('5');

    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith(5);
    expect(res).toEqual(ev);
  });

  it('GET /events/:idOrSlug slug → delega findOneByIdOrSlug com slug', async () => {
    const ev = makeEventEntity({ id: 6, slug: 'my-slug' });
    (service.findOneByIdOrSlug as jest.Mock).mockResolvedValue(
      ev as unknown as import('../../../src/events/entities/event.entity').Event,
    );

    const res = await controller.findOne('my-slug');

    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith('my-slug');
    expect(res).toEqual(ev);
  });
});
