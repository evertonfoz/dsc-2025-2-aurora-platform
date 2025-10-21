import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../../src/events/entities/event.entity';
import { EventsService } from '../../../src/events/events.service';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';
import { UpdateEventDto } from '../../../src/events/dto/update-event.dto';

describe('EventsService \u2013 update', () => {
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

  it('updates event when requester is owner', async () => {
    const existing: any = {
      id: 5,
      ownerUserId: 7,
      startsAt: new Date(Date.now()),
      endsAt: new Date(Date.now() + 1000 * 60 * 60),
    };
    repository.findOneBy.mockResolvedValue(existing as any);
    repository.save.mockResolvedValue({ ...existing, title: 'updated' } as any);

    const result = await service.update(5, { title: 'updated' } as UpdateEventDto, { id: 7, isAdmin: false });
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 5 });
    expect(result.title).toBe('updated');
  });

  it('throws Forbidden when requester is not owner', async () => {
    const existing: any = { id: 6, ownerUserId: 99, startsAt: new Date(), endsAt: new Date(Date.now() + 1000 * 60 * 60) };
    repository.findOneBy.mockResolvedValue(existing as any);
    await expect(service.update(6, { title: 'x' } as UpdateEventDto, { id: 1, isAdmin: false })).rejects.toThrow('Access denied');
  });
});
