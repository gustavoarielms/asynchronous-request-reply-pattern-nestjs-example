export interface IAsyncService {
    startProcess(data: any, externalMethod: () => Promise<any>): Promise<{ status: string; location: string }>;
    getStatus(requestId: string): Promise<any>;
  }