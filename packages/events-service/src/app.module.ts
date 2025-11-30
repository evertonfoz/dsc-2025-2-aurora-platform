import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule, JwtStrategy } from '@aurora/common';
import { EventsModule } from './events.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      signOptions: { expiresIn: 900 },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
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
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      migrationsRun: true,
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      extra: { options: `-c search_path=${process.env.DB_SCHEMA || 'events'}` },
    }),
    EventsModule,
  ],
  controllers: [HealthController],
  providers: [JwtStrategy],
})
export class AppModule {}