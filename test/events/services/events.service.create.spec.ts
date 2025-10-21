import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../../src/events/entities/event.entity';
import { EventsService } from '../../../src/events/events.service';
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';
import { CreateEventDto } from '../../../src/events/dto/create-event.dto';
import {
  makeCreateEventDto,
  makeEventEntity,
} from '../../factories/event.factory';

describe('EventsService  create', () => {
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

  it('creates an event with valid dates and owner', async () => {
    const dto = makeCreateEventDto({
      title: 'My Event',
      summary: 'Summ',
      description: 'Desc',
    });
    const saved = makeEventEntity({
      id: 1,
      slug: 'my-event',
      ...dto,
    } as any) as any;

    repository.findOne.mockResolvedValue(undefined); // ensureUniqueSlug
    repository.create.mockReturnValue(saved);
    repository.save.mockResolvedValue(saved);

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
