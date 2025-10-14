import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum EventState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity()
@Index(['slug'], { unique: true })
@Index(['startsAt'])
@Index(['state', 'visibility'])
export class Event {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255 }) // slug geralmente é varchar, mas sem limite específico, usar 255
  slug: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'varchar', length: 280 })
  summary: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: EventState,
    default: EventState.DRAFT,
  })
  state: EventState;

  @Column({
    type: 'enum',
    enum: EventVisibility,
    default: EventVisibility.PUBLIC,
  })
  visibility: EventVisibility;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  registrationOpensAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  registrationClosesAt?: Date;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  bannerUrl?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  coverUrl?: string;

  @Column({ type: 'int' })
  ownerUserId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}