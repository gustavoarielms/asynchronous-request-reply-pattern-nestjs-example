import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  ASYNC_JOB_NAME,
  ASYNC_PATTERN_QUEUE,
  ASYNC_STATUS_LOCATION_BASE_PATH,
  ASYNC_STATUS_STORE,
} from '../async.tokens';
import { AsyncAcceptedResponse } from '../interfaces/http/async-accepted-response.interface';
import {
  AsyncCompletedResponse,
  AsyncFailedResponse,
  AsyncPendingQueueState,
  AsyncStatusResponse,
} from '../interfaces/http/async-status-response.interface';
import { IAsyncPatternGetStatus } from '../interfaces/services/async-pattern-get-status.interface';
import { IAsyncPatternStartProcess } from '../interfaces/services/async-pattern-start-process.interface';
import { IAsyncStatusStore } from '../interfaces/services/async-status-store.interface';
import { buildStatusLocation } from '../utils/async-status-path.util';

@Injectable()
export class AsyncPatternService implements IAsyncPatternStartProcess, IAsyncPatternGetStatus {
  constructor(
    @Inject(ASYNC_PATTERN_QUEUE) private readonly asyncQueue: Queue<unknown>,
    @Inject(ASYNC_JOB_NAME) private readonly jobName: string,
    @Inject(ASYNC_STATUS_STORE) private readonly asyncStatusStore: IAsyncStatusStore,
    @Inject(ASYNC_STATUS_LOCATION_BASE_PATH) private readonly statusLocationBasePath: string
  ) {}

  async startProcess(data: unknown): Promise<AsyncAcceptedResponse> {
    const job = await this.asyncQueue.add(this.jobName, data);
    await this.asyncStatusStore.setAccepted(String(job.id));

    const response: AsyncAcceptedResponse = {
      status: 'accepted',
    };

    if (this.statusLocationBasePath) {
      response.location = buildStatusLocation(this.statusLocationBasePath, String(job.id));
    }

    return response;
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
        result: this.resolveResult(result),
        completed: true,
      };
      await this.asyncStatusStore.setCompleted(jobId, response.result);
      return response;
    }

    if (state === 'active') {
      await this.asyncStatusStore.setActive(jobId);
      return {
        status: 'active',
        result: this.resolveResult(result),
        completed: false,
      };
    }

    return storedStatus && storedStatus.status === 'accepted'
      ? storedStatus
      : {
      status: state,
      result: this.resolveResult(result),
      completed: false,
    };
  }

  private resolveResult(result: string | null | undefined): string {
    return result ?? 'Processing';
  }
}
