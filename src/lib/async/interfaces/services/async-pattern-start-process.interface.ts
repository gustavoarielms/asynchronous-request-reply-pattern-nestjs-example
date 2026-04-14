import { AsyncAcceptedResponse } from '../http/async-accepted-response.interface';
import { AsyncRequestData } from '../http/async-request-body.interface';

export interface IAsyncPatternStartProcess {
  startProcess(data: AsyncRequestData): Promise<AsyncAcceptedResponse>;
}
