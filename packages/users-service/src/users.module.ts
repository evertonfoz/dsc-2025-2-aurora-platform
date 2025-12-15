import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@aurora/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController, HealthController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
