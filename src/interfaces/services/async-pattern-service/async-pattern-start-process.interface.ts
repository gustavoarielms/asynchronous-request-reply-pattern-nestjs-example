export interface IAsyncPatternStartProcess {
    startProcess(externalMethod: (data) => Promise<any>): Promise<{ status: string; location: string }>;
  }