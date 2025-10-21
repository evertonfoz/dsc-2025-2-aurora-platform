import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../../src/events/entities/event.entity';
import { EventsService } from '../../../src/events/events.service';
import { EventState } from '../../../src/events/enums/event-state.enum';
import { EventVisibility } from '../../../src/events/enums/event-visibility.enum';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';

describe('EventsService', () => {
  let service: EventsService;
  let repository: MockType<Repository<Event>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates an event with valid dates and owner', async () => {
      const dto: any = {
        title: 'My Event',
        summary: 'Summ',
        description: 'Desc',
        startsAt: new Date(Date.now() + 1000 * 60).toISOString(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      };

      const saved = { id: 1, ...dto, slug: 'my-event', state: EventState.DRAFT };

      repository.findOne.mockResolvedValue(undefined); // ensureUniqueSlug
      repository.create.mockReturnValue(saved as any);
      repository.save.mockResolvedValue(saved as any);

      const result = await service.create(dto, 123);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('throws when endsAt is before startsAt', async () => {
      const dto: any = {
        title: 'My Event',
        summary: 'Summ',
        description: 'Desc',
        startsAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        endsAt: new Date(Date.now() + 1000 * 60).toISOString(),
      };
      await expect(service.create(dto, 1)).rejects.toThrow();
    });
  });

  describe('findOneByIdOrSlug', () => {
    it('returns event when found by id and published', async () => {
      const event = new Event();
      event.id = 1;
      event.state = EventState.PUBLISHED;
      event.visibility = EventVisibility.PUBLIC;
      // mock createQueryBuilder
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(event),
      };
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const found = await service.findOneByIdOrSlug(1);
      expect(found).toBe(event);
    });

    it('throws NotFoundException when not found', async () => {
      const qb: any = { where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(undefined) };
      repository.createQueryBuilder.mockReturnValue(qb as any);
      await expect(service.findOneByIdOrSlug(999)).rejects.toThrow('Event not found');
    });

    it('throws Forbidden when event not published and requester not owner', async () => {
      const event = new Event();
      event.id = 2;
      event.state = EventState.DRAFT;
      event.ownerUserId = 10;
      const qb: any = { where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(event) };
      repository.createQueryBuilder.mockReturnValue(qb as any);
      await expect(service.findOneByIdOrSlug(2)).rejects.toThrow('Access denied');
    });
  });

  describe('update', () => {
    it('updates event when requester is owner', async () => {
      const existing: any = {
        id: 5,
        ownerUserId: 7,
        startsAt: new Date(Date.now()),
        endsAt: new Date(Date.now() + 1000 * 60 * 60),
      };
      repository.findOneBy.mockResolvedValue(existing as any);
      repository.save.mockResolvedValue({ ...existing, title: 'updated' } as any);

      const result = await service.update(5, { title: 'updated' } as any, { id: 7, isAdmin: false });
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(result.title).toBe('updated');
    });

    it('throws Forbidden when requester is not owner', async () => {
      const existing: any = { id: 6, ownerUserId: 99, startsAt: new Date(), endsAt: new Date(Date.now() + 1000 * 60 * 60) };
      repository.findOneBy.mockResolvedValue(existing as any);
      await expect(service.update(6, { title: 'x' } as any, { id: 1, isAdmin: false })).rejects.toThrow('Access denied');
    });
  });

  describe('publish', () => {
    it('publishes when owner and in draft', async () => {
      const existing: any = { id: 8, ownerUserId: 20, state: EventState.DRAFT };
      repository.findOneBy.mockResolvedValue(existing as any);
      repository.save.mockResolvedValue({ ...existing, state: EventState.PUBLISHED } as any);

      const result = await service.publish(8, { id: 20, isAdmin: false });
      expect(result.state).toBe(EventState.PUBLISHED);
    });

    it('throws when invalid transition', async () => {
      const existing: any = { id: 9, ownerUserId: 2, state: EventState.PUBLISHED };
      repository.findOneBy.mockResolvedValue(existing as any);
      await expect(service.publish(9, { id: 2, isAdmin: false })).rejects.toThrow('Can only publish draft or archived events');
    });
  });
});
