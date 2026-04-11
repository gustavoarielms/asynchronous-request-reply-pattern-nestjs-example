import { AsyncAcceptedResponse } from '../../http/async/async-accepted-response.interface';
import { AsyncRequestData } from '../../http/async/async-request-body.interface';

export interface IAsyncPatternStartProcess {
  startProcess(data: AsyncRequestData): Promise<AsyncAcceptedResponse>;
}
