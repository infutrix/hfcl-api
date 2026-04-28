import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('HFCL APIs')
    .setDescription(
      'REST API documentation for HFCL platform.\n\n' +
      '## Authentication\n' +
      'Protected endpoints require a **Bearer JWT token** in the `Authorization` header.\n\n' +
      '## Error Codes\n' +
      '| Code | Meaning |\n' +
      '|------|---------|\n' +
      '| 400  | Validation failed – check request body |\n' +
      '| 404  | Resource not found |\n' +
      '| 409  | Conflict – duplicate entry |\n' +
      '| 500  | Internal server error |',
    )
    .setVersion('1.0')
    .setContact('HFCL Dev Team', '', 'dev@hfcl.com')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter JWT token' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
