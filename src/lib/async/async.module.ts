import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ASYNC_PATTERN_GET_STATUS,
  ASYNC_PATTERN_START_PROCESS,
} from './async.tokens';
import { AsyncPatternService } from './services/async-pattern.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'async',
    }),
  ],
  providers: [
    AsyncPatternService,
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
    ASYNC_PATTERN_GET_STATUS,
    ASYNC_PATTERN_START_PROCESS,
  ],
})
export class AsyncLibraryModule {}
