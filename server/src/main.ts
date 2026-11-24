import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { config } from './config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://bingo.io.kr', 'https://bingo.io.kr', config.clientUrl],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api', {
    exclude: ['health', 'metrics'],
  });
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Server running on http://${host}:${port}`);
}
void bootstrap();
