import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../../src/events/entities/event.entity';
import { EventsService } from '../../../src/events/events.service';
import { EventState } from '../../../src/events/enums/event-state.enum';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';

describe('EventsService \u2013 publish', () => {
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
