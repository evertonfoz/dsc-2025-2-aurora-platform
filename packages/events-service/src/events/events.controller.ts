import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, EventResponseDto } from './dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create event' })
  @ApiResponse({ status: 201, description: 'Event created', type: EventResponseDto })
  async create(@Body() createEventDto: CreateEventDto): Promise<EventResponseDto> {
    // TODO: replace placeholder ownerUserId with authenticated user id
    const created = await this.eventsService.create(createEventDto, 1);
    // map to response DTO (normalize Date -> ISO strings)
    return {
      id: typeof created.id === 'number' ? created.id : Number(created.id) || 0,
      slug: (created as any).slug || '',
      title: created.title,
      summary: (created as any).summary || '',
      description: created.description,
      state: (created as any).state || 'draft',
      visibility: (created as any).visibility || 'public',
  startsAt: (created as any).startsAt?.toISOString?.() || (created as any).startsAt || new Date().toISOString(),
      endsAt: (created as any).endsAt?.toISOString?.() || new Date().toISOString(),
      registrationOpensAt: (created as any).registrationOpensAt?.toISOString?.(),
      registrationClosesAt: (created as any).registrationClosesAt?.toISOString?.(),
      capacity: (created as any).capacity,
      bannerUrl: (created as any).bannerUrl,
      coverUrl: (created as any).coverUrl,
      ownerUserId: (created as any).ownerUserId || 0,
      createdAt: (created as any).createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: (created as any).updatedAt?.toISOString?.() || new Date().toISOString(),
    } as EventResponseDto;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({ status: 200, description: 'Event found', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string): Promise<EventResponseDto> {
    const found = await this.eventsService.findOne(id);
    return {
      id: typeof found.id === 'number' ? found.id : Number(found.id) || 0,
      slug: (found as any).slug || '',
      title: found.title,
      summary: (found as any).summary || '',
      description: found.description,
      state: (found as any).state || 'draft',
      visibility: (found as any).visibility || 'public',
  startsAt: (found as any).startsAt?.toISOString?.() || (found as any).startsAt || new Date().toISOString(),
      endsAt: (found as any).endsAt?.toISOString?.() || new Date().toISOString(),
      registrationOpensAt: (found as any).registrationOpensAt?.toISOString?.(),
      registrationClosesAt: (found as any).registrationClosesAt?.toISOString?.(),
      capacity: (found as any).capacity,
      bannerUrl: (found as any).bannerUrl,
      coverUrl: (found as any).coverUrl,
      ownerUserId: (found as any).ownerUserId || 0,
      createdAt: (found as any).createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: (found as any).updatedAt?.toISOString?.() || new Date().toISOString(),
    } as EventResponseDto;
  }
}