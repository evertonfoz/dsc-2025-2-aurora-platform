import { Controller, Post, Get, Patch, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { OwnerId } from '../common/decorators/owner-id.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto, @OwnerId() ownerUserId: number) {
    return this.eventsService.create(createEventDto, ownerUserId);
  }

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('visibility') visibility?: string,
    @Query('state') state?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventsService.findAll({
      q,
      from,
      to,
      visibility,
      state,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    const id = parseInt(idOrSlug, 10);
    if (!isNaN(id)) {
      return this.eventsService.findOneByIdOrSlug(id);
    }
    return this.eventsService.findOneByIdOrSlug(idOrSlug);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEventDto: UpdateEventDto, @OwnerId() ownerUserId: number) {
    return this.eventsService.update(id, updateEventDto, ownerUserId);
  }

  @Post(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @OwnerId() ownerUserId: number) {
    return this.eventsService.publish(id, ownerUserId);
  }
}