import { AsyncRequestData } from '../http/async-request-body.interface';

export interface IBusinessService {
  save(data: AsyncRequestData): Promise<string>;
}
