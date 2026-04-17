export interface AsyncRequestData {
  name: string;
  milliseconds: number;
}

export interface AsyncRequestBody {
  data: AsyncRequestData;
}
