import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../../src/events/entities/event.entity';
import { EventsService } from '../../../src/events/events.service';
import { EventState } from '../../../src/events/enums/event-state.enum';
import { EventVisibility } from '../../../src/events/enums/event-visibility.enum';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';

describe('EventsService  findOneByIdOrSlug', () => {
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
