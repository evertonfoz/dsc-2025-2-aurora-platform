import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Registration } from './entities/registration.entity';
import { AppDataSource } from './data-source';

@Injectable()
export class RegistrationsService {
  private repo: Repository<Registration>;

  constructor() {
    this.repo = AppDataSource.getRepository(Registration);
  }

  async create(registration: Partial<Registration>): Promise<Registration> {
    // Basic duplicate check
    const exists = await this.repo.findOne({ where: { userId: registration.userId, eventId: registration.eventId } });
    if (exists) throw new BadRequestException('User already registered for this event');

    const entity = this.repo.create(registration as Registration);
    return this.repo.save(entity);
  }

  async findByUser(userId: number): Promise<Registration[]> {
    return this.repo.find({ where: { userId } });
  }

  async findByEvent(eventId: number): Promise<Registration[]> {
    return this.repo.find({ where: { eventId } });
  }
}
