import './polyfill-crypto';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
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

  // Global exception filter to properly handle auth errors
  app.useGlobalFilters({
    catch(exception: any, host: any) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        message = typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;
      } else if (exception?.status) {
        status = exception.status;
        message = exception.message || 'Error';
      }

      response.status(status).json({
        statusCode: status,
        message,
        error: exception?.name || 'Error',
      });
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Users Service (PoC)')
    .setDescription('Minimal users provider - Nest.js version')
    .setVersion('0.1.0')
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

  const port = configService.get<number>('PORT') ?? 3011;
  await app.listen(port, '0.0.0.0');
  console.log(`Users service listening on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
