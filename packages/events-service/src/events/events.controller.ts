import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { OwnerId, RolesGuard, Roles, CombinedAuthGuard } from '@aurora/common';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('events')
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  private readonly logger = new Logger(EventsController.name);

  @Post()
  @UseGuards(CombinedAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  create(
    @Body() createEventDto: CreateEventDto,
    @OwnerId() ownerUserId: number,
  ) {
    try {
      this.logger.log(
        `create called by owner=${ownerUserId} title=${createEventDto.title}`,
      );
    } catch {
      /* ignore logging errors */
    }
    return this.eventsService.create(createEventDto, ownerUserId);
  }

  @Get()
  @UseGuards(CombinedAuthGuard, RolesGuard)
  findAll(
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('visibility') visibility?: string,
    @Query('state') state?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const payload = {
      q,
      from,
      to,
      visibility,
      state,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    try {
      this.logger.log(`findAll called with ${JSON.stringify(payload)}`);
    } catch {
      /* ignore */
    }
    return this.eventsService.findAll(payload);
  }

  @Get(':idOrSlug')
  @UseGuards(CombinedAuthGuard, RolesGuard)
  findOne(@Param('idOrSlug') idOrSlug: string) {
    try {
      this.logger.log(`findOne called with idOrSlug=${idOrSlug}`);
    } catch {
      /* ignore */
    }
    const id = parseInt(idOrSlug, 10);
    if (!isNaN(id)) {
      return this.eventsService.findOneByIdOrSlug(id);
    }
    return this.eventsService.findOneByIdOrSlug(idOrSlug);
  }

  @Patch(':id')
  @UseGuards(CombinedAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @OwnerId() ownerUserId: number,
    @Req() req?: Request,
  ) {
    try {
      this.logger.log(`update called id=${id} by owner=${ownerUserId}`);
    } catch {
      /* ignore */
    }
    interface JwtUser {
      id?: number;
      roles?: string[];
    }
    const user = req?.user as unknown as JwtUser | undefined;
    const roles = user?.roles;
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    return this.eventsService.update(id, updateEventDto, {
      id: ownerUserId,
      isAdmin,
    });
  }

  @Post(':id/publish')
  @UseGuards(CombinedAuthGuard, RolesGuard)
  publish(
    @Param('id', ParseIntPipe) id: number,
    @OwnerId() ownerUserId: number,
    @Req() req?: Request,
  ) {
    try {
      this.logger.log(`publish called id=${id} by owner=${ownerUserId}`);
    } catch {
      /* ignore */
    }
    interface JwtUser {
      id?: number;
      roles?: string[];
    }
    const user = req?.user as unknown as JwtUser | undefined;
    const roles = user?.roles;
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    return this.eventsService.publish(id, { id: ownerUserId, isAdmin });
  }
}