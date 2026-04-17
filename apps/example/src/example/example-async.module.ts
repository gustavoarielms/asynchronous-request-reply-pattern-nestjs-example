import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AsyncLibraryModule } from '../../../../src/lib/async/async.module';
import { ExampleAsyncController } from './controllers/async.controller';
import { ExampleAsyncStatusController } from './controllers/async-status.controller';
import { BusinessInteractor } from './interactors/business.interactor';
import { BusinessService } from './services/business.service';

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
    AsyncLibraryModule.forRoot(),
  ],
  controllers: [ExampleAsyncController, ExampleAsyncStatusController],
  providers: [
    BusinessService,
    {
      provide: 'IBusinessService',
      useExisting: BusinessService,
    },
    BusinessInteractor,
  ],
})
export class ExampleAsyncModule {}
