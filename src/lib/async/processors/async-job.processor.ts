import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AsyncStatusResult } from '../interfaces/http/async-status-response.interface';
import { IAsyncStatusStore } from '../interfaces/services/async-status-store.interface';

export type AsyncExecutionMode = 'resolve_now' | 'wait_external';

export abstract class AsyncJobProcessor<
  TPayload = unknown,
  TResult extends AsyncStatusResult = AsyncStatusResult,
  TName extends string = string,
> extends WorkerHost {
  constructor(private readonly asyncStatusStore: IAsyncStatusStore) {
    super();
  }

  async process(job: Job<TPayload, TResult, TName>): Promise<TResult | undefined> {
    const jobId = String(job.id);

    await this.asyncStatusStore.setActive(jobId);

    try {
      const executionMode = await this.getExecutionMode(job.data, job);

      if (executionMode === 'wait_external') {
        const result = await this.startExternal(job.data, job);
        const statusResult: AsyncStatusResult = result === undefined
          ? 'Waiting for external response'
          : result;

        await this.asyncStatusStore.setWaitingExternal(jobId, statusResult);
        return undefined;
      }

      const result = await this.resolve(job.data, job);
      await this.asyncStatusStore.setCompleted(jobId, result);
      return result;
    } catch (error) {
      await this.asyncStatusStore.setFailed(jobId, this.resolveErrorMessage(error));
      throw error;
    }
  }

  protected getExecutionMode(
    _payload: TPayload,
    _job: Job<TPayload, TResult, TName>
  ): AsyncExecutionMode | Promise<AsyncExecutionMode> {
    return 'resolve_now';
  }

  protected abstract resolve(
    payload: TPayload,
    job: Job<TPayload, TResult, TName>
  ): Promise<TResult>;

  protected startExternal(
    _payload: TPayload,
    _job: Job<TPayload, TResult, TName>
  ): Promise<AsyncStatusResult | undefined> {
    throw new Error('startExternal must be implemented when execution mode is wait_external');
  }

  private resolveErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unexpected error';
  }
}
