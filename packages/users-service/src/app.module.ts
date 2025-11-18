import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';
import { RootController } from './root.controller';

@Module({
  imports: [UsersModule],
  controllers: [HealthController, RootController],
})
export class AppModule {}
