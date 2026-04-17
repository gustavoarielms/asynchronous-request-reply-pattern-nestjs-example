import { AsyncAcceptedResponse } from '../http/async-accepted-response.interface';

export interface IAsyncPatternStartProcess {
  startProcess(data: unknown): Promise<AsyncAcceptedResponse>;
}
