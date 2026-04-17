import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AsyncAcceptedResponse } from '../interfaces/http/async-accepted-response.interface';
import {
  AsyncCompletedResponse,
  AsyncFailedResponse,
  AsyncPendingQueueState,
  AsyncStatusResponse,
} from '../interfaces/http/async-status-response.interface';
import { IAsyncPatternGetStatus } from '../interfaces/services/async-pattern-get-status.interface';
import { IAsyncPatternStartProcess } from '../interfaces/services/async-pattern-start-process.interface';
import { AsyncStatusStoreService } from './async-status-store.service';

@Injectable()
export class AsyncPatternService implements IAsyncPatternStartProcess, IAsyncPatternGetStatus {
  constructor(
    @InjectQueue('async') private readonly asyncQueue: Queue<unknown>,
    private readonly asyncStatusStore: AsyncStatusStoreService
  ) {}

  async startProcess(data: unknown): Promise<AsyncAcceptedResponse> {
    const job = await this.asyncQueue.add('processJob', data);
    await this.asyncStatusStore.setAccepted(String(job.id));

    return {
      status: 'accepted',
      location: `/async-status/status/${job.id}`,
    };
  }

  async getStatus(jobId: string): Promise<AsyncStatusResponse> {
    const storedStatus = await this.asyncStatusStore.get(jobId);
    const job = await this.asyncQueue.getJob(jobId);

    if (!job && !storedStatus) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (!job && storedStatus) {
      return storedStatus;
    }

    const state = await job.getState() as AsyncPendingQueueState | 'completed' | 'failed';
    const result = job.returnvalue;

    if (state === 'failed') {
      const response: AsyncFailedResponse = {
        status: state,
        result: job.failedReason,
        completed: true,
      };
      await this.asyncStatusStore.setFailed(jobId, response.result);
      return response;
    }

    if (state === 'completed') {
      const response: AsyncCompletedResponse = {
        status: state,
        result: result || 'Processing',
        completed: true,
      };
      await this.asyncStatusStore.setCompleted(jobId, response.result);
      return response;
    }

    if (state === 'active') {
      await this.asyncStatusStore.setActive(jobId);
      return {
        status: 'active',
        result: result || 'Processing',
        completed: false,
      };
    }

    return storedStatus && storedStatus.status === 'accepted'
      ? storedStatus
      : {
      status: state,
      result: result || 'Processing',
      completed: false,
    };
  }
}
