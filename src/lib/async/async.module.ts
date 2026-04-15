import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ASYNC_PATTERN_GET_STATUS,
  ASYNC_PATTERN_START_PROCESS,
} from './async.tokens';
import { AsyncPatternService } from './services/async-pattern.service';
import { AsyncStatusStoreService } from './services/async-status-store.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'async',
    }),
  ],
  providers: [
    AsyncPatternService,
    AsyncStatusStoreService,
    {
      provide: ASYNC_PATTERN_GET_STATUS,
      useExisting: AsyncPatternService,
    },
    {
      provide: ASYNC_PATTERN_START_PROCESS,
      useExisting: AsyncPatternService,
    },
  ],
  exports: [
    AsyncPatternService,
    AsyncStatusStoreService,
    ASYNC_PATTERN_GET_STATUS,
    ASYNC_PATTERN_START_PROCESS,
  ],
})
export class AsyncLibraryModule {}
