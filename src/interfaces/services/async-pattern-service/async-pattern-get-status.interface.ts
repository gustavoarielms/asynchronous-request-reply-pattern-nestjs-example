export interface IAsyncPatternGetStatus {
    getStatus(requestId: string): Promise<any>;
  }