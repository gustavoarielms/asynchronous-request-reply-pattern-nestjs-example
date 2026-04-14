import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { ASYNC_PATTERN_START_PROCESS } from '../async.tokens';
import { AsyncAcceptedResponse } from '../interfaces/http/async-accepted-response.interface';
import { AsyncRequestBody } from '../interfaces/http/async-request-body.interface';
import { IAsyncPatternStartProcess } from '../interfaces/services/async-pattern-start-process.interface';

@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  constructor(
    @Inject(ASYNC_PATTERN_START_PROCESS)
    private readonly asyncService: IAsyncPatternStartProcess
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<AsyncAcceptedResponse>> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; body?: Partial<AsyncRequestBody> }>();

    if (request.method !== 'GET') {
      if (request.body?.data) {
        return of(await this.asyncService.startProcess(request.body.data));
      }

      throw new BadRequestException('Data field is required');
    }

    return next.handle();
  }
}
