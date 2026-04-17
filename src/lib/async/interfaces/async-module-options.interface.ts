import { AsyncAllowedMethod } from './async-options.interface';

export interface AsyncModuleOptions {
  queueName?: string;
  jobName?: string;
  defaultAllowedMethods?: AsyncAllowedMethod[];
  exposeStatusController?: boolean;
  statusBasePath?: string;
  statusLocationBasePath?: string;
}
