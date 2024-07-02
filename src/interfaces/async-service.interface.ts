export interface IAsyncService {
    startProcess(data: any): Promise<{ status: string; location: string }>;
    getStatus(requestId: string): Promise<any>;
  }