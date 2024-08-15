import { Module, Scope } from '@nestjs/common';
import { AsyncController } from '../controllers/async/async.controller';
import { AsyncStatusController } from '../controllers/async-status/async-status.controller';
import { AsyncPatternService } from '../services/async/async.service';
import { BusinessService } from '../services/business/business.service';
import { BusinessInteractor } from '../interactors/business/business.interactor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports:[
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null
      },
    }),
    BullModule.registerQueue({
      name: 'async',
    })],
  controllers: [AsyncController, AsyncStatusController],
  providers: [
    {
      provide: 'IAsyncPatternGetStatus',
      useClass: AsyncPatternService,
      scope: Scope.REQUEST
    },
    {
      provide: 'IAsyncPatternStartProcess',
      useClass: AsyncPatternService,
      scope: Scope.REQUEST
    },
    {
      provide: 'IBusinessService',
      useClass: BusinessService,
      scope: Scope.REQUEST
    },
    BusinessInteractor
  ],
})

export class AsyncModule {}