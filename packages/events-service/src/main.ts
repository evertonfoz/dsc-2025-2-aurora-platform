// packages/events-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Criar aplicação Nest
  const app = await NestFactory.create(AppModule);

  // 2. Configurar validação automática (aplica class-validator em todos os 
  //    DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // retorna erro se receber propriedades 
                                // extras
    transform: true,            // transforma payloads em instâncias de 
                                // DTOs
  }));

  // 3. Configurar Swagger (documentação automática)
  const config = new DocumentBuilder()
    .setTitle('Events Service (PoC)')
    .setDescription('Minimal events provider - Nest.js version')
    .setVersion('0.1.0')
    .addTag('events')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // UI disponível em /docs

  // 4. Iniciar servidor
  const port = process.env.PORT || 3012;
  await app.listen(port);
  
  console.log(`✅ Events service listening on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();                            