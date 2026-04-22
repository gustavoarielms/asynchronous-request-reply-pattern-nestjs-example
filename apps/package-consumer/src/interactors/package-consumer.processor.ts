import { Inject, Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  ASYNC_STATUS_STORE,
  IAsyncStatusStore,
} from '@gustavoarielms/nestjs-async-request-reply';
import { Job } from 'bullmq';
import { IPackageConsumerService } from '../interfaces/package-consumer-service.interface';
import { PackageConsumerRequest } from '../interfaces/package-consumer-request.interface';

@Processor('package-consumer')
@Injectable()
export class PackageConsumerProcessor extends WorkerHost {
  constructor(
    @Inject('IPackageConsumerService')
    private readonly packageConsumerService: IPackageConsumerService,
    @Inject(ASYNC_STATUS_STORE)
    private readonly asyncStatusStore: IAsyncStatusStore
  ) {
    super();
  }

  async process(job: Job<PackageConsumerRequest, string, string>): Promise<string> {
    const jobId = String(job.id);

    await this.asyncStatusStore.setActive(jobId);

    try {
      const result = await this.packageConsumerService.process(job.data);
      await this.asyncStatusStore.setCompleted(jobId, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      await this.asyncStatusStore.setFailed(jobId, message);
      throw error;
    }
  }
}
