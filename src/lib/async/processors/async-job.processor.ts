import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AsyncStatusResult } from '../interfaces/http/async-status-response.interface';
import { IAsyncStatusStore } from '../interfaces/services/async-status-store.interface';

export abstract class AsyncJobProcessor<
  TPayload = unknown,
  TResult extends AsyncStatusResult = AsyncStatusResult,
  TName extends string = string,
> extends WorkerHost {
  constructor(private readonly asyncStatusStore: IAsyncStatusStore) {
    super();
  }

  async process(job: Job<TPayload, TResult, TName>): Promise<TResult> {
    const jobId = String(job.id);

    await this.asyncStatusStore.setActive(jobId);

    try {
      const result = await this.handle(job.data, job);
      await this.asyncStatusStore.setCompleted(jobId, result);
      return result;
    } catch (error) {
      await this.asyncStatusStore.setFailed(jobId, this.resolveErrorMessage(error));
      throw error;
    }
  }

  protected abstract handle(
    payload: TPayload,
    job: Job<TPayload, TResult, TName>
  ): Promise<TResult>;

  private resolveErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unexpected error';
  }
}
