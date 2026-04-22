import { PackageConsumerRequest } from './package-consumer-request.interface';

export interface IPackageConsumerService {
  process(data: PackageConsumerRequest): Promise<string>;
}
