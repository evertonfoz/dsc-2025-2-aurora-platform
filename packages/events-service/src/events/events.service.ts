import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';
import { EventState } from './enums/event-state.enum';
import { EventVisibility } from './enums/event-visibility.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, ownerUserId: number): Promise<Event> {
    // Validate dates
    const startsAt = new Date(createEventDto.startsAt);
    const endsAt = new Date(createEventDto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    // Validate registration dates if provided
    if (
      createEventDto.registrationOpensAt &&
      createEventDto.registrationClosesAt
    ) {
      const opensAt = new Date(createEventDto.registrationOpensAt);
      const closesAt = new Date(createEventDto.registrationClosesAt);
      if (closesAt <= opensAt || opensAt < startsAt || closesAt > endsAt) {
        throw new BadRequestException('Invalid registration dates');
      }
    }

    // Generate slug
    let slug = createEventDto.slug ?? this.toSlug(createEventDto.title);
    slug = await this.ensureUniqueSlug(slug);

    const event = this.repository.create({
      ...createEventDto,
      startsAt,
      endsAt,
      registrationOpensAt: createEventDto.registrationOpensAt
        ? new Date(createEventDto.registrationOpensAt)
        : undefined,
      registrationClosesAt: createEventDto.registrationClosesAt
        ? new Date(createEventDto.registrationClosesAt)
        : undefined,
      slug,
      state: EventState.DRAFT,
      visibility: createEventDto.visibility ?? EventVisibility.PUBLIC,
      ownerUserId,
    } as Partial<Event>);

    return this.repository.save(event);
  }

  async findOne(idOrSlug: string): Promise<Event> {
    // try numeric id first
    const asNumber = Number(idOrSlug);
    let event: Event | null = null;
    if (!Number.isNaN(asNumber)) {
      event = await this.repository.findOne({ where: { id: asNumber } as any });
    }
    if (!event) {
      event = await this.repository.findOne({ where: { slug: idOrSlug } as any });
    }
    if (!event) {
      throw new NotFoundException(`Event with id/slug ${idOrSlug} not found`);
    }
    return event;
  }

  private toSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 240);
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.repository.findOne({ where: { slug } as any, select: ['id'] as any });
      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}