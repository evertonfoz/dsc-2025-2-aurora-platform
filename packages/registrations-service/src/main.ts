import { NestFactory } from '@nestjs/core';
import { RegistrationsModule } from './registrations.module';
import { AppDataSource } from './data-source';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '@aurora/common';

async function bootstrap() {
  // initialize DB connection before starting the app so repositories are available
  // initialize DB connection before starting the app so repositories are available
  const maxRetries = 10;
  const delayMs = 2000;
  let connected = false;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await AppDataSource.initialize();
      connected = true;
      break;
    } catch (err) {
      console.error(`DB init attempt ${attempt}/${maxRetries} failed:`, err?.message || err);
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }

  if (!connected) {
    console.error('Could not initialize DB after retries — aborting start.');
    process.exit(1);
  }

  const app = await NestFactory.create(RegistrationsModule);
  // Basic global setup consistent with other services
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // In development, allow auto-injecting a fake user so OwnerId() decorator
  // resolves during quick local tests (DO NOT enable in production).
  if (process.env.DEV_AUTO_AUTH === 'true') {
    app.use((req: any, _res: any, next: any) => {
      if (!req.user) {
        req.user = { sub: 1, id: 1 };
      }
      next();
    });
  }

  await app.listen(3013, '0.0.0.0');
}

bootstrap();
