import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto';
import { OwnerId } from '@aurora/common';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post()
  async create(@OwnerId() ownerId: number, @Body() dto: CreateRegistrationDto) {
    return this.service.create({ userId: ownerId, eventId: dto.eventId, origin: dto.origin });
  }

  @Get('my')
  async myRegistrations(@OwnerId() ownerId: number) {
    return this.service.findByUser(ownerId);
  }

  @Get('event/:eventId')
  async byEvent(@Param('eventId') eventId: string) {
    return this.service.findByEvent(Number(eventId));
  }
}
