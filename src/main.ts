import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const app2 = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite default port
      'http://localhost:3000', // Alternative
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://192.168.0.101:5173',
      // everyone is allowed
      'http://localhost:*',
      'http://127.0.0.1:*',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });
  app2.enableCors({
    origin: [
      'http://localhost:5173', // Vite default port
      'http://localhost:3000', // Alternative
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://192.168.0.101:5173',
      // everyone is allowed
      'http://localhost:*',
      'http://127.0.0.1:*',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        // Get the first validation error
        const firstError = errors[0];
        const message = Object.values(firstError.constraints || {})[0];

        // Return formatted error
        return new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: message,
          },
        });
      },
    }),
  );

  app.setGlobalPrefix('api/v1');
  app2.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        // Get the first validation error
        const firstError = errors[0];
        const message = Object.values(firstError.constraints || {})[0];

        // Return formatted error
        return new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: message,
          },
        });
      },
    }),
  );

  app2.setGlobalPrefix('api/v1');

  // ============ SWAGGER SETUP ============
  const config = new DocumentBuilder()
    .setTitle('Anonymous Chat API')
    .setDescription('Real-time group chat service API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('rooms', 'Room management endpoints')
    .addTag('messages', 'Message endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter session token: sess_xxxxx',
        in: 'header',
      },
      'session-token', // This name will be used in decorators
    )
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Access at /api/docs
  // =======================================

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  await app2.listen(process.env.PORT_2 || 3001, '0.0.0.0');
  console.log(
    `Application running on: http://localhost:${process.env.PORT || 3000}`,
  );
  console.log(
    `Swagger UI available at: http://localhost:${process.env.PORT_2 || 3000}/api/docs`,
  );
}
bootstrap();
