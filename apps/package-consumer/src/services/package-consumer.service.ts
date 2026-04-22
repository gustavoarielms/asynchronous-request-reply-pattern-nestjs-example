import { Injectable } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import { IPackageConsumerService } from '../interfaces/package-consumer-service.interface';
import { PackageConsumerRequest } from '../interfaces/package-consumer-request.interface';

@Injectable()
export class PackageConsumerService implements IPackageConsumerService {
  async process(data: PackageConsumerRequest): Promise<string> {
    await delay(data.milliseconds);

    if (data.name.startsWith('fail:')) {
      throw new Error(`Simulated package consumer failure for ${data.name}`);
    }

    return `Consumer processed: ${data.name}`;
  }
}
