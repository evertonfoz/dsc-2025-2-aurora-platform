import { Test } from '@nestjs/testing';
import { EventsController } from '../../../src/events/events.controller';
import { EventsService } from '../../../src/events/events.service';
import { EventState } from '../../../src/events/enums/event-state.enum';

describe('EventsController – find', () => {
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
    service.findAll.mockResolvedValue({ events: [], total: 0, page: 1, limit: 20 });
    const res = await controller.findAll(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
    expect(res).toHaveProperty('events');
  });

  it('GET /events/:idOrSlug numeric → delega findOneByIdOrSlug com number', async () => {
    service.findOneByIdOrSlug.mockResolvedValue({ id: 5 });
    const res = await controller.findOne('5');
    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith(5);
    expect(res).toEqual({ id: 5 });
  });

  it('GET /events/:idOrSlug slug → delega findOneByIdOrSlug com slug', async () => {
    service.findOneByIdOrSlug.mockResolvedValue({ id: 6 });
    const res = await controller.findOne('my-slug');
    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith('my-slug');
    expect(res).toEqual({ id: 6 });
  });
});
