import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  ASYNC_EXTERNAL_STATUS_RESOLVER,
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
  AsyncStatusResult,
  AsyncWaitingExternalResponse,
} from '../interfaces/http/async-status-response.interface';
import { IAsyncExternalStatusResolver } from '../interfaces/services/async-external-status-resolver.interface';
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
    @Inject(ASYNC_STATUS_LOCATION_BASE_PATH) private readonly statusLocationBasePath: string,
    @Optional()
    @Inject(ASYNC_EXTERNAL_STATUS_RESOLVER)
    private readonly externalStatusResolver?: IAsyncExternalStatusResolver
  ) {}

  async startProcess(data: unknown): Promise<AsyncAcceptedResponse> {
    const job = await this.asyncQueue.add(this.jobName, data);
    const jobId = String(job.id);
    const existingStatus = await this.asyncStatusStore.get(jobId);

    if (!existingStatus) {
      await this.asyncStatusStore.setAccepted(jobId);
    }

    const response: AsyncAcceptedResponse = {
      status: 'accepted',
    };

    if (this.statusLocationBasePath) {
      response.location = buildStatusLocation(this.statusLocationBasePath, jobId);
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

    if (storedStatus?.status === 'waiting_external') {
      return this.resolveWaitingExternalStatus(jobId, storedStatus, job.data);
    }

    if (storedStatus?.completed) {
      return storedStatus;
    }

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
        result: this.resolveCompletedResult(result),
        completed: true,
      };
      await this.asyncStatusStore.setCompleted(jobId, response.result);
      return response;
    }

    if (state === 'active') {
      await this.asyncStatusStore.setActive(jobId);
      return {
        status: 'active',
        result: this.resolveInProgressResult(result),
        completed: false,
      };
    }

    return storedStatus && storedStatus.status === 'accepted'
      ? storedStatus
      : {
      status: state,
      result: this.resolveInProgressResult(result),
      completed: false,
    };
  }

  private resolveCompletedResult(result: unknown): AsyncStatusResult {
    return result === undefined ? 'Processing' : this.toStatusResult(result);
  }

  private async resolveWaitingExternalStatus(
    jobId: string,
    waitingStatus: AsyncWaitingExternalResponse,
    payload: unknown
  ): Promise<AsyncStatusResponse> {
    if (!this.externalStatusResolver) {
      return waitingStatus;
    }

    const externalStatus = await this.externalStatusResolver.resolveExternalStatus({
      jobId,
      payload,
      waitingStatus,
    });

    if (!externalStatus) {
      return waitingStatus;
    }

    if (externalStatus.status === 'completed') {
      await this.asyncStatusStore.setCompleted(jobId, externalStatus.result);
      return externalStatus;
    }

    if (externalStatus.status === 'failed') {
      await this.asyncStatusStore.setFailed(jobId, externalStatus.result);
      return externalStatus;
    }

    await this.asyncStatusStore.setWaitingExternal(jobId, externalStatus.result);
    return externalStatus;
  }

  private resolveInProgressResult(result: unknown): AsyncStatusResult {
    return result === undefined || result === null
      ? 'Processing'
      : this.toStatusResult(result);
  }

  private toStatusResult(result: unknown): AsyncStatusResult {
    if (this.isPrimitiveStatusResult(result)) {
      return result;
    }

    return JSON.parse(JSON.stringify(result)) as AsyncStatusResult;
  }

  private isPrimitiveStatusResult(
    result: unknown
  ): result is string | number | boolean | null {
    return (
      result === null
      || typeof result === 'string'
      || typeof result === 'number'
      || typeof result === 'boolean'
    );
  }
}
