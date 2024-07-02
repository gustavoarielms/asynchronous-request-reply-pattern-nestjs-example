import { Module, Scope } from '@nestjs/common';
import { AsyncService } from '../services/async/async.service';
import { AsyncController } from '../controllers/async/async.controller';
import { AsyncStatusController } from '../controllers/async-status/async-status.controller';
import { AsyncInterceptor } from 'src/interceptors/async/async.interceptor';

@Module({
  controllers: [AsyncController, AsyncStatusController],
  providers: [
    {
      provide: 'IAsyncService',
      useClass: AsyncService,
      scope: Scope.REQUEST
    },
    AsyncInterceptor,
  ],
})
export class AsyncModule {}