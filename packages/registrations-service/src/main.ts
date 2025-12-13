import './polyfill-crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { HttpExceptionFilter } from '@aurora/common';
import { RegistrationsModule } from './registrations.module';
import { AppDataSource } from './data-source';

function createRateLimitMiddleware(limit: number, ttlMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: any, res: any, next: () => void) => {
    const now = Date.now();
    const key = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + ttlMs });
      return next();
    }
    if (entry.count >= limit) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }
    entry.count += 1;
    hits.set(key, entry);
    next();
  };
}

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
  const configService = app.get(ConfigService);
  const rateLimitTtlMs = (configService.get<number>('RATE_LIMIT_TTL') ?? 60) * 1000;
  const rateLimitLimit = configService.get<number>('RATE_LIMIT_LIMIT') ?? 100;
  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? '*';

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.use(createRateLimitMiddleware(rateLimitLimit, rateLimitTtlMs));
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

  const port = configService.get<number>('PORT') ?? 3013;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
