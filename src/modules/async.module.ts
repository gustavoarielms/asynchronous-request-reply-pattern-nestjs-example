import { Module, Scope } from '@nestjs/common';
import { AsyncController } from '../controllers/async/async.controller';
import { AsyncStatusController } from '../controllers/async-status/async-status.controller';
import { AsyncPatternService } from '../services/async/async.service';
import { BusinessService } from '../services/business/business.service';
import { BusinessInteractor } from '../interactors/business/business.interactor';

@Module({
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
    {
      provide: 'IBusinessInteractor',
      useClass: BusinessInteractor,
      scope: Scope.REQUEST
    }
  ],
})
export class AsyncModule {}