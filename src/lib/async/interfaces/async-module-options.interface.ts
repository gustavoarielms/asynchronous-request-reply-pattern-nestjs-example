import { AsyncAllowedMethod } from './async-options.interface';

export interface AsyncModuleOptions {
  queueName?: string;
  defaultAllowedMethods?: AsyncAllowedMethod[];
  exposeStatusController?: boolean;
  statusBasePath?: string;
}
