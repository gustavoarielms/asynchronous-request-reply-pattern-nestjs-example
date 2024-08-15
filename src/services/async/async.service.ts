import { Injectable } from '@nestjs/common';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';
import { IAsyncPatternGetStatus } from '../../interfaces/services/async-pattern-service/async-pattern-get-status.interface';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AsyncPatternService implements IAsyncPatternStartProcess, IAsyncPatternGetStatus {

  constructor(
    @InjectQueue('async') private asyncQueue: Queue
    ) {}
  
  async startProcess(data: any): Promise<{ status: string; location: string }> {
    
    const job = await this.asyncQueue.add('processJob', 
      { data: data }
    );

    return {
      status: 'accepted',
      location: `/async-status/status/${job.id}`,
    };
  }

  async getStatus(jobId: string): Promise<any> {
    const job = await this.asyncQueue.getJob(jobId);
    if (!job) {
      return { status: 'Not found' };
    }

    const state = await job.getState();
    const result = job.returnvalue;

    if(state === 'failed')
      return {
        status: state,
        result: job.failedReason,
    };

    return {
      status: state,
      result: result || 'Processing',
    };
  }
}