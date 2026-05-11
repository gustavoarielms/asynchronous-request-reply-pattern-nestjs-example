export interface AsyncRequestData {
  name: string;
  milliseconds: number;
  mode?: 'external';
  externalStatusLookup?: boolean;
}

export interface AsyncRequestBody {
  data: AsyncRequestData;
}

export interface WebhookRequestBody {
  result: string;
}
