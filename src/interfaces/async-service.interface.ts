export interface IAsyncService {
    startProcess(data: any): Promise<string>;
    getStatus(requestId: string): Promise<any>;
  }