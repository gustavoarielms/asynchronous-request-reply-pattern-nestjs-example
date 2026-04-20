import { DynamicModule, Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import {
  ASYNC_JOB_NAME,
  ASYNC_MODULE_OPTIONS,
  ASYNC_PATTERN_GET_STATUS,
  ASYNC_PATTERN_QUEUE,
  ASYNC_PATTERN_START_PROCESS,
  ASYNC_STATUS_BASE_PATH,
  ASYNC_STATUS_LOCATION_BASE_PATH,
  ASYNC_STATUS_STORE,
} from './async.tokens';
import { AsyncModuleOptions } from './interfaces/async-module-options.interface';
import { createAsyncStatusController } from './controllers/async-status.controller';
import { AsyncPatternService } from './services/async-pattern.service';
import { AsyncStatusStoreService } from './services/async-status-store.service';
import { normalizeStatusBasePath } from './utils/async-status-path.util';

const DEFAULT_ASYNC_MODULE_OPTIONS: Required<AsyncModuleOptions> = {
  queueName: 'async',
  jobName: 'processJob',
  defaultAllowedMethods: ['POST', 'PUT', 'PATCH'],
  exposeStatusController: false,
  statusBasePath: 'async-status',
  statusLocationBasePath: '',
  statusTtlSeconds: 60 * 60 * 24,
  statusStoreClass: AsyncStatusStoreService,
};

@Module({})
export class AsyncLibraryModule {
  static forRoot(options: AsyncModuleOptions = {}): DynamicModule {
    if (
      options.statusTtlSeconds !== undefined
      && options.statusTtlSeconds !== null
      && (!Number.isInteger(options.statusTtlSeconds) || options.statusTtlSeconds < 1)
    ) {
      throw new Error('statusTtlSeconds must be a positive integer or null');
    }

    const resolvedOptions: Required<AsyncModuleOptions> = {
      ...DEFAULT_ASYNC_MODULE_OPTIONS,
      ...options,
      statusBasePath: normalizeStatusBasePath(
        options.statusBasePath ?? DEFAULT_ASYNC_MODULE_OPTIONS.statusBasePath
      ),
      statusLocationBasePath: normalizeStatusBasePath(
        options.statusLocationBasePath
          ?? (options.exposeStatusController ? options.statusBasePath ?? DEFAULT_ASYNC_MODULE_OPTIONS.statusBasePath : '')
      ),
    };

    const statusController = resolvedOptions.exposeStatusController
      ? createAsyncStatusController(resolvedOptions.statusBasePath)
      : null;
    const statusStoreClass = resolvedOptions.statusStoreClass;

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
          provide: ASYNC_STATUS_BASE_PATH,
          useValue: resolvedOptions.statusBasePath,
        },
        {
          provide: ASYNC_JOB_NAME,
          useValue: resolvedOptions.jobName,
        },
        {
          provide: ASYNC_STATUS_LOCATION_BASE_PATH,
          useValue: resolvedOptions.statusLocationBasePath,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useExisting: getQueueToken(resolvedOptions.queueName),
        },
        statusStoreClass,
        {
          provide: ASYNC_STATUS_STORE,
          useExisting: statusStoreClass,
        },
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
        ASYNC_MODULE_OPTIONS,
        ASYNC_JOB_NAME,
        ASYNC_STATUS_BASE_PATH,
        ASYNC_STATUS_LOCATION_BASE_PATH,
        ASYNC_STATUS_STORE,
        AsyncPatternService,
        ASYNC_PATTERN_GET_STATUS,
        ASYNC_PATTERN_START_PROCESS,
      ],
      controllers: statusController ? [statusController] : [],
    };
  }
}
