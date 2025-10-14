import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'citext', length: 160 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export { UserRole };
