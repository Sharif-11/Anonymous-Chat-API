import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting application...');

  // Create app instance - this initializes all modules including DbModule
  const app = await NestFactory.create(AppModule);

  // The database connection is already established here
  // because DbModule's useFactory ran during app creation

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`✅ Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
