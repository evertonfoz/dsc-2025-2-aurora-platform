import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Repository } from 'typeorm';
import { EventState } from './enums/event-state.enum';
import { EventVisibility } from './enums/event-visibility.enum';

type MockRepository<T = any> = Partial<Record<string, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
});

describe('EventsService', () => {
  let service: EventsService;
  let repo: MockRepository<Event>;

  beforeEach(async () => {
    repo = createMockRepository<Event>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
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

      repo.create!.mockReturnValue(saved);
      repo.save!.mockResolvedValue(saved);
      // ensureUniqueSlug calls repository.findOne -> use findOne mock
      repo.findOne!.mockResolvedValue(undefined);

      const result = await service.create(dto, 123);
  expect(repo.create).toHaveBeenCalled();
  expect(repo.save).toHaveBeenCalled();
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
      repo.createQueryBuilder!.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(event),
      });

      const found = await service.findOneByIdOrSlug(1);
      expect(found).toBe(event);
    });

    it('throws NotFoundException when not found', async () => {
      repo.createQueryBuilder!.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      });

      await expect(service.findOneByIdOrSlug(999)).rejects.toThrow('Event not found');
    });

    it('throws Forbidden when event not published and requester not owner', async () => {
      const event = new Event();
      event.id = 2;
      event.state = EventState.DRAFT;
      event.ownerUserId = 10;
      repo.createQueryBuilder!.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(event),
      });

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
      repo.findOneBy!.mockResolvedValue(existing);
      repo.save!.mockResolvedValue({ ...existing, title: 'updated' });

      const result = await service.update(5, { title: 'updated' } as any, { id: 7, isAdmin: false });
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(result.title).toBe('updated');
    });

    it('throws Forbidden when requester is not owner', async () => {
      const existing: any = { id: 6, ownerUserId: 99, startsAt: new Date(), endsAt: new Date(Date.now() + 1000 * 60 * 60) };
      repo.findOneBy!.mockResolvedValue(existing);
      await expect(service.update(6, { title: 'x' } as any, { id: 1, isAdmin: false })).rejects.toThrow('Access denied');
    });
  });

  describe('publish', () => {
    it('publishes when owner and in draft', async () => {
      const existing: any = { id: 8, ownerUserId: 20, state: EventState.DRAFT };
      repo.findOneBy!.mockResolvedValue(existing);
      repo.save!.mockResolvedValue({ ...existing, state: EventState.PUBLISHED });

      const result = await service.publish(8, { id: 20, isAdmin: false });
      expect(result.state).toBe(EventState.PUBLISHED);
    });

    it('throws when invalid transition', async () => {
      const existing: any = { id: 9, ownerUserId: 2, state: EventState.PUBLISHED };
      repo.findOneBy!.mockResolvedValue(existing);
      await expect(service.publish(9, { id: 2, isAdmin: false })).rejects.toThrow('Can only publish draft or archived events');
    });
  });
});
