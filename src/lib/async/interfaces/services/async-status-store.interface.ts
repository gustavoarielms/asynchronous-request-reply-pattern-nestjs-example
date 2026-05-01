import { AsyncStatusResponse, AsyncStatusResult } from '../http/async-status-response.interface';

export interface IAsyncStatusStore {
  get(jobId: string): Promise<AsyncStatusResponse | null>;
  setAccepted(jobId: string): Promise<void>;
  setActive(jobId: string): Promise<void>;
  setWaitingExternal(jobId: string, result: AsyncStatusResult): Promise<void>;
  setCompleted(jobId: string, result: AsyncStatusResult): Promise<void>;
  setFailed(jobId: string, result: AsyncStatusResult): Promise<void>;
}
