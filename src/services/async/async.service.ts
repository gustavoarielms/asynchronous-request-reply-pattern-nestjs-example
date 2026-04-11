import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AsyncAcceptedResponse } from '../../interfaces/http/async/async-accepted-response.interface';
import { AsyncRequestData } from '../../interfaces/http/async/async-request-body.interface';
import {
  AsyncPendingQueueState,
  AsyncStatusResponse,
} from '../../interfaces/http/async/async-status-response.interface';
import { IAsyncPatternGetStatus } from '../../interfaces/services/async-pattern-service/async-pattern-get-status.interface';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';

@Injectable()
export class AsyncPatternService implements IAsyncPatternStartProcess, IAsyncPatternGetStatus {
  constructor(
    @InjectQueue('async') private asyncQueue: Queue<AsyncRequestData>
  ) {}

  async startProcess(data: AsyncRequestData): Promise<AsyncAcceptedResponse> {
    const job = await this.asyncQueue.add('processJob', data);

    return {
      status: 'accepted',
      location: `/async-status/status/${job.id}`,
    };
  }

  async getStatus(jobId: string): Promise<AsyncStatusResponse> {
    const job = await this.asyncQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const state = await job.getState() as AsyncPendingQueueState | 'completed' | 'failed';
    const result = job.returnvalue;

    if (state === 'failed') {
      return {
        status: state,
        result: job.failedReason,
        completed: true,
      };
    }

    if (state === 'completed') {
      return {
        status: state,
        result: result || 'Processing',
        completed: true,
      };
    }

    return {
      status: state,
      result: result || 'Processing',
      completed: false,
    };
  }
}
