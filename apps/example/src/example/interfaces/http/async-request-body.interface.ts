export interface AsyncRequestData {
  name: string;
  milliseconds: number;
  mode?: 'external';
}

export interface AsyncRequestBody {
  data: AsyncRequestData;
}

export interface WebhookRequestBody {
  result: string;
}
