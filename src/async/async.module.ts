import { Module } from '@nestjs/common';
import { AsyncService } from './async.service';
import { AsyncController } from './async.controller';
import { AsyncStatusController } from './async-status.controller';
import { AsyncService } from './async.service';

@Module({
  controllers: [AsyncController, AsyncStatusController],
  providers: [AsyncService],
})
export class AsyncModule {}