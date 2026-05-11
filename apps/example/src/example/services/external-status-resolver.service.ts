import { Injectable } from '@nestjs/common';
import {
  AsyncExternalStatusContext,
  AsyncExternalStatusResolution,
  IAsyncExternalStatusResolver,
} from '../../../../../src/lib/async/interfaces/services/async-external-status-resolver.interface';
import { AsyncRequestData } from '../interfaces/http/async-request-body.interface';

@Injectable()
export class ExternalStatusResolverService implements IAsyncExternalStatusResolver<AsyncRequestData> {
  private readonly lookupAttemptsByJobId = new Map<string, number>();

  async resolveExternalStatus(
    context: AsyncExternalStatusContext<AsyncRequestData>
  ): Promise<AsyncExternalStatusResolution> {
    if (!context.payload?.externalStatusLookup) {
      return null;
    }

    const lookupAttempts = this.lookupAttemptsByJobId.get(context.jobId) ?? 0;
    this.lookupAttemptsByJobId.set(context.jobId, lookupAttempts + 1);

    if (lookupAttempts < 2) {
      return null;
    }

    return {
      status: 'completed',
      result: `External status lookup completed: ${context.payload.name}`,
      completed: true,
    };
  }
}
