import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@aurora/common';

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
  const app = await NestFactory.create(AppModule);
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
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = configService.get<number>('PORT') ?? 3010;
  // bind to 0.0.0.0 so container ports are reachable from host
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`auth-service (Nest) listening on port ${port}`);
}

if (require.main === module) {
  bootstrap();
}

export default {} as unknown;
