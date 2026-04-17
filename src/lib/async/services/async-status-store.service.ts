import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ASYNC_PATTERN_QUEUE } from '../async.tokens';
import { AsyncStatusResponse } from '../interfaces/http/async-status-response.interface';

const STATUS_KEY_PREFIX = 'async:status';
const STATUS_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class AsyncStatusStoreService {
  constructor(
    @Inject(ASYNC_PATTERN_QUEUE) private readonly asyncQueue: Queue<unknown>
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

  async setCompleted(jobId: string, result: string): Promise<void> {
    await this.set(jobId, {
      status: 'completed',
      result,
      completed: true,
    });
  }

  async setFailed(jobId: string, result: string): Promise<void> {
    await this.set(jobId, {
      status: 'failed',
      result,
      completed: true,
    });
  }

  private async set(jobId: string, value: AsyncStatusResponse): Promise<void> {
    const client = await this.asyncQueue.client;
    await client.set(this.getKey(jobId), JSON.stringify(value), 'EX', STATUS_TTL_SECONDS);
  }

  private getKey(jobId: string): string {
    return `${STATUS_KEY_PREFIX}:${jobId}`;
  }
}
