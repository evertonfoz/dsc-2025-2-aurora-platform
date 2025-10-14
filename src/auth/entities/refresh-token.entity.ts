import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column()
  userId: number;

  @Column()
  expiresAt: Date;
}