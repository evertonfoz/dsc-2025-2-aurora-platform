import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventState } from './enums/event-state.enum';
import { EventVisibility } from './enums/event-visibility.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { toSlug } from './utils/slug.util';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  private readonly logger = new Logger(EventsService.name);

  async create(
    createEventDto: CreateEventDto,
    ownerUserId: number,
  ): Promise<Event> {
    try {
      this.logger.log(`create called owner=${ownerUserId} title=${createEventDto.title}`);
    } catch (e) {}
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
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    let slug = createEventDto.slug || toSlug(createEventDto.title);
    slug = await this.ensureUniqueSlug(slug);

    const event = this.eventRepository.create({
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
    });

    return this.eventRepository.save(event);
  }

  async findAll(query: {
    q?: string;
    from?: string;
    to?: string;
    visibility?: string;
    state?: string;
    page: number;
    limit: number;
  }) {
    try {
      this.logger.log(`findAll querying with ${JSON.stringify(query)}`);
    } catch (e) {}
    const qb = this.eventRepository.createQueryBuilder('event');

    // Filters
    if (query.q) {
      qb.andWhere('(event.title ILIKE :q OR event.summary ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }
    if (query.from) {
      qb.andWhere('event.startsAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('event.startsAt <= :to', { to: new Date(query.to) });
    }
    if (query.visibility) {
      qb.andWhere('event.visibility = :visibility', {
        visibility: query.visibility,
      });
    } else {
      qb.andWhere('event.visibility = :visibility', {
        visibility: EventVisibility.PUBLIC,
      });
    }
    if (query.state) {
      qb.andWhere('event.state = :state', { state: query.state });
    } else {
      qb.andWhere('event.state = :state', { state: EventState.PUBLISHED });
    }

    // Pagination
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    // Order by startsAt
    qb.orderBy('event.startsAt', 'ASC');

    const [events, total] = await qb.getManyAndCount();
    return { events, total, page: query.page, limit: query.limit };
  }

  async findOneByIdOrSlug(
    idOrSlug: number | string,
    requester?: { id: number; isAdmin: boolean },
  ): Promise<Event> {
    try {
      this.logger.log(`findOneByIdOrSlug called with ${String(idOrSlug)}`);
    } catch (e) {}
    const qb = this.eventRepository.createQueryBuilder('event');
    if (typeof idOrSlug === 'number') {
      qb.where('event.id = :id', { id: idOrSlug });
    } else {
      qb.where('event.slug = :slug', { slug: idOrSlug });
    }

    const event = await qb.getOne();
    if (!event) {
      try {
        this.logger.log(`event not found for ${String(idOrSlug)}`);
      } catch (e) {}
      throw new NotFoundException('Event not found');
    }

    // Check visibility
    if (event.state !== EventState.PUBLISHED) {
      if (
        !requester ||
        (requester.id !== event.ownerUserId && !requester.isAdmin)
      ) {
        throw new ForbiddenException('Access denied');
      }
    }

    return event;
  }

  async update(
    id: number,
    updateEventDto: UpdateEventDto,
    requester: { id: number; isAdmin: boolean },
  ): Promise<Event> {
    try {
      this.logger.log(`update called id=${id} by requester=${JSON.stringify(requester)}`);
    } catch (e) {}
    const event = await this.eventRepository.findOneBy({ id });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check ownership/admin
    if (requester.id !== event.ownerUserId && !requester.isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    // Validate dates if updating
    let startsAt = event.startsAt;
    let endsAt = event.endsAt;
    if (updateEventDto.startsAt) {
      startsAt = new Date(updateEventDto.startsAt);
    }
    if (updateEventDto.endsAt) {
      endsAt = new Date(updateEventDto.endsAt);
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    // Update slug if provided
    let slug = event.slug;
    if (updateEventDto.slug) {
      slug = await this.ensureUniqueSlug(updateEventDto.slug, id);
    }

    // Update fields
    Object.assign(event, {
      ...updateEventDto,
      startsAt,
      endsAt,
      registrationOpensAt: updateEventDto.registrationOpensAt
        ? new Date(updateEventDto.registrationOpensAt)
        : event.registrationOpensAt,
      registrationClosesAt: updateEventDto.registrationClosesAt
        ? new Date(updateEventDto.registrationClosesAt)
        : event.registrationClosesAt,
      slug,
    });

    return this.eventRepository.save(event);
  }

  async publish(
    id: number,
    requester: { id: number; isAdmin: boolean },
  ): Promise<Event> {
    try {
      this.logger.log(`publish called id=${id} by requester=${JSON.stringify(requester)}`);
    } catch (e) {}
    const event = await this.eventRepository.findOneBy({ id });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check ownership/admin
    if (requester.id !== event.ownerUserId && !requester.isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    // Check valid transition
    if (
      event.state !== EventState.DRAFT &&
      event.state !== EventState.ARCHIVED
    ) {
      throw new BadRequestException(
        'Can only publish draft or archived events',
      );
    }

    event.state = EventState.PUBLISHED;
    return this.eventRepository.save(event);
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: number,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.eventRepository.findOne({
        where: { slug },
        select: ['id'],
      });
      if (!existing || existing.id === excludeId) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
