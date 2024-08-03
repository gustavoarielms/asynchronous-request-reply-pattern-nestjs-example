import { Injectable } from '@nestjs/common';
import { myQueue } from '../../config/bullmq.config';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';
import { IAsyncPatternGetStatus } from '../../interfaces/services/async-pattern-service/async-pattern-get-status.interface';
@Injectable()
export class AsyncPatternService implements IAsyncPatternStartProcess, IAsyncPatternGetStatus {
  
  async startProcess(externalMethod: Function): Promise<{ status: string; location: string }> {

    const serializedMethod = externalMethod.toString();
    const job = await myQueue.add('process-job', {method: serializedMethod } );

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