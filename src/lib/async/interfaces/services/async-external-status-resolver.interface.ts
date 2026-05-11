import {
  AsyncCompletedResponse,
  AsyncFailedResponse,
  AsyncStatusResult,
  AsyncWaitingExternalResponse,
} from '../http/async-status-response.interface';

export type AsyncExternalStatusResolution =
  | AsyncCompletedResponse
  | AsyncFailedResponse
  | AsyncWaitingExternalResponse
  | null;

export interface AsyncExternalStatusContext<TPayload = unknown> {
  jobId: string;
  payload: TPayload | undefined;
  waitingStatus: AsyncWaitingExternalResponse;
}

export interface IAsyncExternalStatusResolver<TPayload = unknown> {
  resolveExternalStatus(
    context: AsyncExternalStatusContext<TPayload>
  ): Promise<AsyncExternalStatusResolution>;
}

export type AsyncExternalStatusResult = AsyncStatusResult;
