// packages/events-service/src/main.ts
import './polyfill-crypto';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '@aurora/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ? Number(process.env.PORT) : 3012;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Events service listening on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();