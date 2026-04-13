import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AsyncRequestData } from '../../interfaces/http/async/async-request-body.interface';
import { IBusinessService } from '../../interfaces/services/business-service.interface';

@Processor('async')
export class BusinessInteractor extends WorkerHost {
  constructor(
    @Inject('IBusinessService') private readonly businessService: IBusinessService
  ) {
    super();
  }

  async process(job: Job<AsyncRequestData, string, string>): Promise<string> {
    return this.businessService.save(job.data);
  }
}
