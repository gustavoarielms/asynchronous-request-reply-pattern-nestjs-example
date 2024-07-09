import { Injectable } from '@nestjs/common';
import { myQueue } from '../../config/bullmq.config';

@Injectable()
export class AsyncService {
  
  async startProcess(data: any, externalMethod: () => Promise<any>): Promise<{ status: string; location: string }> {
    const job = await myQueue.add('process-job', { data });
    
    externalMethod();

    return {
      status: 'accepted',
      location: `/async-status/status/${job.id}`,
    };
  }

  async getStatus(jobId: string): Promise<any> {
    const job = await myQueue.getJob(jobId);
    if (!job) {
      return { status: 'Not found' };
    }

    const state = await job.getState();
    const result = job.returnvalue;

    return {
      status: state,
      result: result || 'Processing',
    };
  }
}