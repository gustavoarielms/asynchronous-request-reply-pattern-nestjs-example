import { Inject, Scope } from '@nestjs/common';
import { IBusinessService } from '../../interfaces/services/business-service.interface';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';


@Processor({
  name: 'async',
  scope: Scope.REQUEST,
})
export class BusinessInteractor extends WorkerHost {

  constructor(
    @Inject('IBusinessService') private readonly businessService: IBusinessService
  ) {  
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    return this.businessService.save(job.data);;
  }
}