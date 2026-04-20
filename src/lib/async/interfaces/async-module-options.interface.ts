import { Type } from '@nestjs/common';
import { AsyncAllowedMethod } from './async-options.interface';
import { IAsyncStatusStore } from './services/async-status-store.interface';

export interface AsyncModuleOptions {
  queueName?: string;
  jobName?: string;
  defaultAllowedMethods?: AsyncAllowedMethod[];
  exposeStatusController?: boolean;
  statusBasePath?: string;
  statusLocationBasePath?: string;
  statusTtlSeconds?: number | null;
  statusStoreClass?: Type<IAsyncStatusStore>;
}
