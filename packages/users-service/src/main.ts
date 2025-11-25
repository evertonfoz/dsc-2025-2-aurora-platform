import './polyfill-crypto';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT ? Number(process.env.PORT) : 3011;
  await app.listen(port, '0.0.0.0');
  console.log(`Users service listening on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
