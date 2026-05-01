import { Inject } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ASYNC_STATUS_STORE } from '../../../../../src/lib/async/async.tokens';
import { IAsyncStatusStore } from '../../../../../src/lib/async/interfaces/services/async-status-store.interface';
import { AsyncJobProcessor } from '../../../../../src/lib/async/processors/async-job.processor';
import { AsyncRequestData } from '../interfaces/http/async-request-body.interface';
import { IBusinessService } from '../interfaces/services/business-service.interface';

@Processor('async')
export class BusinessInteractor extends AsyncJobProcessor<AsyncRequestData, string> {
  constructor(
    @Inject('IBusinessService') private readonly businessService: IBusinessService,
    @Inject(ASYNC_STATUS_STORE) asyncStatusStore: IAsyncStatusStore
  ) {
    super(asyncStatusStore);
  }

  protected resolve(jobData: AsyncRequestData, _job: Job<AsyncRequestData, string, string>): Promise<string> {
    return this.businessService.save(jobData);
  }
}
