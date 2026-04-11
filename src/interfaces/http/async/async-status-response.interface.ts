export type AsyncPendingQueueState =
  | 'active'
  | 'delayed'
  | 'paused'
  | 'prioritized'
  | 'waiting'
  | 'waiting-children';

export interface AsyncFailedResponse {
  status: 'failed';
  result: string;
  completed: true;
}

export interface AsyncCompletedResponse {
  status: 'completed';
  result: string;
  completed: true;
}

export interface AsyncPendingResponse {
  status: AsyncPendingQueueState;
  result: string;
  completed: false;
}

export type AsyncStatusResponse =
  | AsyncFailedResponse
  | AsyncCompletedResponse
  | AsyncPendingResponse;
