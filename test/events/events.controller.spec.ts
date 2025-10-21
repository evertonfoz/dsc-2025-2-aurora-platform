import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from '../../src/events/events.controller';
import { EventsService } from '../../src/events/events.service';
import { EventState } from '../../src/events/enums/event-state.enum';

describe('EventsController', () => {
  let controller: EventsController;
  let service: Partial<Record<keyof EventsService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOneByIdOrSlug: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service.create', async () => {
    const dto = { title: 't' } as any;
    (service.create as jest.Mock).mockResolvedValue({ id: 1 });
    const res = await controller.create(dto, 12 as any);
    expect(service.create).toHaveBeenCalledWith(dto, 12);
    expect(res).toEqual({ id: 1 });
  });

  it('findAll should pass query defaults', async () => {
    (service.findAll as jest.Mock).mockResolvedValue({ events: [], total: 0, page: 1, limit: 20 });
    const res = await controller.findAll(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
    expect(res).toHaveProperty('events');
  });

  it('findOne with numeric id calls service with number', async () => {
    (service.findOneByIdOrSlug as jest.Mock).mockResolvedValue({ id: 5 });
    const res = await controller.findOne('5');
    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith(5);
    expect(res).toEqual({ id: 5 });
  });

  it('findOne with slug calls service with string', async () => {
    (service.findOneByIdOrSlug as jest.Mock).mockResolvedValue({ id: 6 });
    const res = await controller.findOne('my-slug');
    expect(service.findOneByIdOrSlug).toHaveBeenCalledWith('my-slug');
    expect(res).toEqual({ id: 6 });
  });

  it('update delegates to service.update', async () => {
    (service.update as jest.Mock).mockResolvedValue({ id: 2, title: 'x' });
    const res = await controller.update(2 as any, { title: 'x' } as any, 7 as any);
    expect(service.update).toHaveBeenCalledWith(2, { title: 'x' }, { id: 7, isAdmin: false });
    expect(res).toEqual({ id: 2, title: 'x' });
  });

  it('publish delegates to service.publish', async () => {
    (service.publish as jest.Mock).mockResolvedValue({ id: 3, state: EventState.PUBLISHED });
    const res = await controller.publish(3 as any, 7 as any);
    expect(service.publish).toHaveBeenCalledWith(3, { id: 7, isAdmin: false });
    expect(res.state).toBe(EventState.PUBLISHED);
  });
});
