import { AsyncStatusResponse } from '../http/async-status-response.interface';

export interface IAsyncStatusStore {
  get(jobId: string): Promise<AsyncStatusResponse | null>;
  setAccepted(jobId: string): Promise<void>;
  setActive(jobId: string): Promise<void>;
  setCompleted(jobId: string, result: string): Promise<void>;
  setFailed(jobId: string, result: string): Promise<void>;
}
