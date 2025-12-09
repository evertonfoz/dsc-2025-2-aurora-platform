import { NestFactory } from '@nestjs/core';
import { RegistrationsModule } from './registrations.module';

async function bootstrap() {
  const app = await NestFactory.create(RegistrationsModule);
  await app.listen(3013);
}

bootstrap();
