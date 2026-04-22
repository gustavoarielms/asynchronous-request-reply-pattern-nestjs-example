import { NestFactory } from '@nestjs/core';
import { PackageConsumerModule } from './package-consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(PackageConsumerModule);
  const port = Number(process.env.PORT ?? 3100);
  await app.listen(port, '127.0.0.1');
}

bootstrap();
