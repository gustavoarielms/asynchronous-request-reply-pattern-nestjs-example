export type AsyncQueueState =
  | 'active'
  | 'completed'
  | 'delayed'
  | 'paused'
  | 'prioritized'
  | 'waiting'
  | 'waiting-children';

export interface AsyncNotFoundResponse {
  status: 'Not found';
}

export interface AsyncFailedResponse {
  status: 'failed';
  result: string;
}

export interface AsyncInProgressResponse {
  status: AsyncQueueState;
  result: string;
}

export type AsyncStatusResponse =
  | AsyncNotFoundResponse
  | AsyncFailedResponse
  | AsyncInProgressResponse;
