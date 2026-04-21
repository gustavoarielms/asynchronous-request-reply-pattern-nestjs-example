import { Inject, Injectable, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ASYNC_MODULE_OPTIONS, ASYNC_PATTERN_QUEUE } from '../async.tokens';
import { AsyncModuleOptions } from '../interfaces/async-module-options.interface';
import { AsyncStatusResponse, AsyncStatusResult } from '../interfaces/http/async-status-response.interface';

const STATUS_KEY_PREFIX = 'async:status';
const DEFAULT_STATUS_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class AsyncStatusStoreService {
  constructor(
    @Inject(ASYNC_PATTERN_QUEUE) private readonly asyncQueue: Queue<unknown>,
    @Optional()
    @Inject(ASYNC_MODULE_OPTIONS)
    private readonly moduleOptions?: AsyncModuleOptions
  ) {}

  async get(jobId: string): Promise<AsyncStatusResponse | null> {
    const client = await this.asyncQueue.client;
    const payload = await client.get(this.getKey(jobId));

    if (!payload) {
      return null;
    }

    return JSON.parse(payload) as AsyncStatusResponse;
  }

  async setAccepted(jobId: string): Promise<void> {
    await this.set(jobId, {
      status: 'accepted',
      result: 'Queued',
      completed: false,
    });
  }

  async setActive(jobId: string): Promise<void> {
    await this.set(jobId, {
      status: 'active',
      result: 'Processing',
      completed: false,
    });
  }

  async setCompleted(jobId: string, result: AsyncStatusResult): Promise<void> {
    await this.set(jobId, {
      status: 'completed',
      result,
      completed: true,
    });
  }

  async setFailed(jobId: string, result: AsyncStatusResult): Promise<void> {
    await this.set(jobId, {
      status: 'failed',
      result,
      completed: true,
    });
  }

  private async set(jobId: string, value: AsyncStatusResponse): Promise<void> {
    const client = await this.asyncQueue.client;
    const serializedValue = JSON.stringify(value);
    const statusTtlSeconds = this.moduleOptions?.statusTtlSeconds === undefined
      ? DEFAULT_STATUS_TTL_SECONDS
      : this.moduleOptions.statusTtlSeconds;

    if (statusTtlSeconds === null) {
      await client.set(this.getKey(jobId), serializedValue);
      return;
    }

    await client.set(this.getKey(jobId), serializedValue, 'EX', statusTtlSeconds);
  }

  private getKey(jobId: string): string {
    return `${STATUS_KEY_PREFIX}:${jobId}`;
  }
}
