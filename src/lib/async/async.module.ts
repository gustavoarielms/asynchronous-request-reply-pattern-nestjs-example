import { DynamicModule, Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import {
  ASYNC_MODULE_OPTIONS,
  ASYNC_PATTERN_GET_STATUS,
  ASYNC_PATTERN_QUEUE,
  ASYNC_PATTERN_START_PROCESS,
} from './async.tokens';
import { AsyncModuleOptions } from './interfaces/async-module-options.interface';
import { AsyncPatternService } from './services/async-pattern.service';
import { AsyncStatusStoreService } from './services/async-status-store.service';

const DEFAULT_ASYNC_MODULE_OPTIONS: Required<AsyncModuleOptions> = {
  queueName: 'async',
  defaultAllowedMethods: ['POST', 'PUT', 'PATCH'],
};

@Module({})
export class AsyncLibraryModule {
  static forRoot(options: AsyncModuleOptions = {}): DynamicModule {
    const resolvedOptions: Required<AsyncModuleOptions> = {
      ...DEFAULT_ASYNC_MODULE_OPTIONS,
      ...options,
    };

    return {
      module: AsyncLibraryModule,
      imports: [
        BullModule.registerQueue({
          name: resolvedOptions.queueName,
        }),
      ],
      providers: [
        {
          provide: ASYNC_MODULE_OPTIONS,
          useValue: resolvedOptions,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useExisting: getQueueToken(resolvedOptions.queueName),
        },
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
        ASYNC_MODULE_OPTIONS,
        AsyncPatternService,
        AsyncStatusStoreService,
        ASYNC_PATTERN_GET_STATUS,
        ASYNC_PATTERN_START_PROCESS,
      ],
    };
  }
}
