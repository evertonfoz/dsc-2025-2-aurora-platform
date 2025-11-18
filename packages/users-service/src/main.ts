import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    // get underlying Express instance and register redirect
    // this is safe when using the default platform-express
    // (if using Fastify, prefer creating a RootController)
    const httpAdapter = app.getHttpAdapter();
    // httpAdapter.getInstance() returns the underlying express app
    // when using platform-express
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressApp: any = httpAdapter.getInstance && httpAdapter.getInstance();
    if (expressApp && typeof expressApp.get === 'function') {
      expressApp.get('/', (req: Request, res: Response) => res.redirect('/docs'));
    }
  } catch (err) {
    // ignore if adapter doesn't expose getInstance
  }

  const port = process.env.PORT || 3011;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Users service listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
