import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RegistrationStatus } from '../enums/registration-status.enum';

@Entity({ name: 'registrations' })
@Index(['userId', 'eventId'], { unique: true })
export class Registration {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column({ type: 'int', name: 'user_id' })
  userId!: number;

  @Column({ type: 'int', name: 'event_id' })
  eventId!: number;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    name: 'status',
    default: RegistrationStatus.PENDING,
  })
  status!: RegistrationStatus;

  @Column({
    type: 'timestamptz',
    name: 'inscription_date',
    default: () => 'now()',
  })
  inscriptionDate!: Date;

  @Column({ type: 'timestamptz', name: 'cancellation_date', nullable: true })
  cancellationDate?: Date | null;

  @Column({ type: 'varchar', length: 50, name: 'origin', nullable: true })
  origin?: string | null;

  @Column({ type: 'boolean', name: 'check_in_done', default: false })
  checkInDone!: boolean;

  @Column({ type: 'timestamptz', name: 'check_in_date', nullable: true })
  checkInDate?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
