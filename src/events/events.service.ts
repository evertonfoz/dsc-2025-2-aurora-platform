import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  async create(createEventDto: CreateEventDto, ownerUserId: number) {
    // TODO: implement
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
    // TODO: implement
  }

  async findOneByIdOrSlug(idOrSlug: number | string) {
    // TODO: implement
  }

  async update(id: number, updateEventDto: UpdateEventDto, ownerUserId: number) {
    // TODO: implement
  }

  async publish(id: number, ownerUserId: number) {
    // TODO: implement
  }
}