import { Module } from '@nestjs/common';
import { AsyncService } from '../services/async/async.service';
import { AsyncController } from '../controllers/async/async.controller';
import { AsyncStatusController } from '../controllers/async-status/async-status.controller';

@Module({
  controllers: [AsyncController, AsyncStatusController],
  providers: [AsyncService],
})
export class AsyncModule {}