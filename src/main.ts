import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Lumi API')
    .setDescription('API para gerenciamento de faturas de energia')
    .setVersion('1.0')
    .addTag('invoices')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Configuração de validação global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Habilitar CORS
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`Aplicação rodando na porta ${process.env.PORT ?? 3000}`);
  console.log(`Documentação Swagger disponível em: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
