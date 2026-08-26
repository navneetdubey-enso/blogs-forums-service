import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = 4002;

  const config = new DocumentBuilder()
    .setTitle('Blogs & Forums Service API')
    .setDescription('API documentation for the Blogs & Forums Service')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`)
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Service-Auth-Token',
        in: 'header',
        description: 'Service authentication token',
      },
      'service-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}

void bootstrap();
