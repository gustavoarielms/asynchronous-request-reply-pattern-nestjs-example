import { AsyncStatusResponse } from '../../http/async/async-status-response.interface';

export interface IAsyncPatternGetStatus {
  getStatus(requestId: string): Promise<AsyncStatusResponse>;
}
