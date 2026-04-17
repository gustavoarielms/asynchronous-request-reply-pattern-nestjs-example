import { AsyncRequestData } from '../../../../../../src/lib/async/interfaces/http/async-request-body.interface';

export interface IBusinessService {
  save(data: AsyncRequestData): Promise<string>;
}
