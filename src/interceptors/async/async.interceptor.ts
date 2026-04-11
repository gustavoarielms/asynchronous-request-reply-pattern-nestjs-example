import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { AsyncAcceptedResponse } from '../../interfaces/http/async/async-accepted-response.interface';
import { AsyncRequestBody } from '../../interfaces/http/async/async-request-body.interface';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';

@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  constructor(
    @Inject('IAsyncPatternStartProcess') private readonly asyncService: IAsyncPatternStartProcess
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<AsyncAcceptedResponse>> {
    const request = context.switchToHttp().getRequest<{ method: string; body?: Partial<AsyncRequestBody> }>();

    if (request.method !== 'GET') {
      if (request.body?.data) {
        const serviceResponse = await this.asyncService.startProcess(request.body.data);
        return of(serviceResponse);
      }

      throw new BadRequestException('Data field is required');
    }

    return next.handle();
  }
}
