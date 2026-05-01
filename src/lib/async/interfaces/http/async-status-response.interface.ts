export type AsyncStatusResult =
  | string
  | number
  | boolean
  | null
  | AsyncStatusResult[]
  | { [key: string]: AsyncStatusResult };

export type AsyncPendingQueueState =
  | 'active'
  | 'accepted'
  | 'delayed'
  | 'paused'
  | 'prioritized'
  | 'waiting'
  | 'waiting-children';

export interface AsyncFailedResponse {
  status: 'failed';
  result: AsyncStatusResult;
  completed: true;
}

export interface AsyncCompletedResponse {
  status: 'completed';
  result: AsyncStatusResult;
  completed: true;
}

export interface AsyncPendingResponse {
  status: AsyncPendingQueueState;
  result: AsyncStatusResult;
  completed: false;
}

export interface AsyncWaitingExternalResponse {
  status: 'waiting_external';
  result: AsyncStatusResult;
  completed: false;
}

export type AsyncStatusResponse =
  | AsyncFailedResponse
  | AsyncCompletedResponse
  | AsyncPendingResponse
  | AsyncWaitingExternalResponse;
