import { Test } from '@nestjs/testing';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';
import { EventState } from '../../../src/events/enums/event-state.enum';
import { makeEventEntity } from '../../factories/event.factory';

describe('EventsController – findOne', () => {
  let controller: EventsController;
  const service = { findAll: jest.fn(), findOneByIdOrSlug: jest.fn() } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(EventsController);
    jest.clearAllMocks();
  });

  it('GET /events → delega findAll e retorna resultado', async () => {
    const ev = makeEventEntity() as any;
    service.findAll.mockResolvedValue({ events: [ev], total: 1, page: 1, limit: 20 });
    const res = await controller.findAll(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
    expect(res).toHaveProperty('events');
    expect(res.events[0]).toMatchObject({ id: ev.id, title: ev.title });
  });

  it('GET /events/:idOrSlug numeric → delega findOneByIdOrSlug com number', async () => {
    const ev = makeEventEntity({ id: 5 } as any) as any;
    service.findOneByIdOrSlug.mockResolvedValue(ev);
    const res = await controller.findOne('5');
    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith(5);
    expect(res).toEqual(ev);
  });

  it('GET /events/:idOrSlug slug → delega findOneByIdOrSlug com slug', async () => {
    const ev = makeEventEntity({ id: 6, slug: 'my-slug' } as any) as any;
    service.findOneByIdOrSlug.mockResolvedValue(ev);
    const res = await controller.findOne('my-slug');
    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith('my-slug');
    expect(res).toEqual(ev);
  });
});
