import { CreateEventDto } from '../../src/events/dto/create-event.dto';
import { Event } from '../../src/events/entities/event.entity';
import { EventVisibility } from '../../src/events/enums/event-visibility.enum';
import { EventState } from '../../src/events/enums/event-state.enum';

let seq = 1;

export function makeCreateEventDto(overrides?: Partial<CreateEventDto>): CreateEventDto {
  const now = new Date();
  const startsAt = new Date(now.getTime() + 1000 * 60 * 60).toISOString();
  const endsAt = new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString();
  const base: CreateEventDto = {
    title: `Event ${seq}`,
    summary: 'Summary',
    description: 'Description',
    startsAt,
    endsAt,
    visibility: EventVisibility.PUBLIC,
  } as CreateEventDto;
  seq++;
  return { ...base, ...(overrides ?? {}) } as CreateEventDto;
}

export function makeEventEntity(overrides?: Partial<Event>): Partial<Event> {
  const dto = makeCreateEventDto();
  const base: Partial<Event> = {
    id: Math.floor(Math.random() * 100000),
    slug: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: dto.title,
    summary: dto.summary,
    description: dto.description,
    startsAt: new Date(dto.startsAt),
    endsAt: new Date(dto.endsAt),
    visibility: dto.visibility ?? EventVisibility.PUBLIC,
    state: EventState.DRAFT,
    ownerUserId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { ...base, ...(overrides ?? {}) };
}
