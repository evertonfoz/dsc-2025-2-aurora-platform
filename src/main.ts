import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new TransformResponseInterceptor(),
  );

  // Definir o prefixo global antes de configurar o Swagger
  app.setGlobalPrefix('v1');

  const config = new DocumentBuilder()
    .setTitle('Users Service')
    .setVersion('1.0')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(process.env.PORT ?? 3001);
}

// trate a promise para não ficar “flutuante”
bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Nest bootstrap failed:', err);
  process.exitCode = 1;
});
