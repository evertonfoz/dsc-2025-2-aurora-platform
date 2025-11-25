import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '@aurora/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = process.env.PORT ? Number(process.env.PORT) : 3010;
  // bind to 0.0.0.0 so container ports are reachable from host
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`auth-service (Nest) listening on port ${port}`);
}

if (require.main === module) {
  bootstrap();
}

export default {} as unknown;
