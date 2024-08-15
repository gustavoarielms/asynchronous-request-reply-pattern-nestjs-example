export interface IAsyncPatternStartProcess {
    startProcess(data: any): Promise<{ status: string; location: string }>;
  }