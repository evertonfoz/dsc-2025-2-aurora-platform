// packages/events-service/src/main.ts
import './polyfill-crypto';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { HttpExceptionFilter } from '@aurora/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

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

  // Use the shared HttpExceptionFilter from @aurora/common to ensure consistent
  // handling of Passport/Nest exceptions (handles cross-package instanceof issues)
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Events Service (PoC)')
    .setDescription('Minimal events provider - Nest.js version')
    .setVersion('0.1.0')
    .addTag('events')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // redirect root to docs (works with default Express adapter)
  try {
    const httpAdapter = app.getHttpAdapter();
    const expressApp: any = httpAdapter.getInstance && httpAdapter.getInstance();
    if (expressApp && typeof expressApp.get === 'function') {
      expressApp.get('/', (req: Request, res: Response) => res.redirect('/docs'));
    }
  } catch (err) {
    // ignore if adapter doesn't expose getInstance
  }

  const port = configService.get<number>('PORT') ?? 3012;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Events service listening on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
