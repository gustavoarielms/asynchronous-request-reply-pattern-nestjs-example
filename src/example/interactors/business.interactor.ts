import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AsyncRequestData } from '../../lib/async/interfaces/http/async-request-body.interface';
import { AsyncStatusStoreService } from '../../lib/async/services/async-status-store.service';
import { IBusinessService } from '../interfaces/services/business-service.interface';

@Processor('async')
export class BusinessInteractor extends WorkerHost {
  constructor(
    @Inject('IBusinessService') private readonly businessService: IBusinessService,
    private readonly asyncStatusStore: AsyncStatusStoreService
  ) {
    super();
  }

  async process(job: Job<AsyncRequestData, string, string>): Promise<string> {
    const jobId = String(job.id);

    await this.asyncStatusStore.setActive(jobId);

    try {
      const result = await this.businessService.save(job.data);
      await this.asyncStatusStore.setCompleted(jobId, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      await this.asyncStatusStore.setFailed(jobId, message);
      throw error;
    }
  }
}
