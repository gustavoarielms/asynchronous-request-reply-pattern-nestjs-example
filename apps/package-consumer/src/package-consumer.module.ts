import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AsyncLibraryModule } from '@gustavoarielms/nestjs-async-request-reply';
import { PackageConsumerController } from './controllers/package-consumer.controller';
import { PackageConsumerProcessor } from './interactors/package-consumer.processor';
import { PackageConsumerService } from './services/package-consumer.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
      },
    }),
    AsyncLibraryModule.forRoot({
      queueName: 'package-consumer',
      jobName: 'consumer.task',
      exposeStatusController: true,
      statusBasePath: 'consumer-status',
    }),
  ],
  controllers: [PackageConsumerController],
  providers: [
    PackageConsumerService,
    {
      provide: 'IPackageConsumerService',
      useExisting: PackageConsumerService,
    },
    PackageConsumerProcessor,
  ],
})
export class PackageConsumerModule {}
