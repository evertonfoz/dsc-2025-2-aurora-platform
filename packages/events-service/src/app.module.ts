import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      // Use a shared DB by default. For per-service logical isolation
      // prefer using a dedicated schema per service (see DB_SCHEMA).
      database: process.env.DB_NAME || 'aurora_db',
      // Optional: logical schema for this service (keeps tables isolated
      // inside the same DB). Defaults to 'events'.
      schema: process.env.DB_SCHEMA || 'events',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // dev only
    }),
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}