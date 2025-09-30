import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.use(helmet());
 app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
 
 // Definir o prefixo global antes de configurar o Swagger
 app.setGlobalPrefix('v1');
 
 const config = new DocumentBuilder()
 .setTitle('Users Service')
 .setVersion('1.0')
 .addTag('users')
 .build();
 
 const document = SwaggerModule.createDocument(app, config);
 SwaggerModule.setup('docs', app, document);
 await app.listen(process.env.PORT || 3001);
}
bootstrap();