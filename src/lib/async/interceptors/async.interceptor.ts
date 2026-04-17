import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { ASYNC_PATTERN_START_PROCESS } from '../async.tokens';
import { ASYNC_OPTIONS } from '../decorators/async.decorator';
import { AsyncAcceptedResponse } from '../interfaces/http/async-accepted-response.interface';
import { AsyncOptions } from '../interfaces/async-options.interface';
import { IAsyncPatternStartProcess } from '../interfaces/services/async-pattern-start-process.interface';

@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ASYNC_PATTERN_START_PROCESS)
    private readonly asyncService: IAsyncPatternStartProcess
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<AsyncAcceptedResponse>> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; body?: unknown }>();

    if (request.method !== 'GET') {
      const options =
        this.reflector.get<AsyncOptions>(ASYNC_OPTIONS, context.getHandler()) ?? {};
      const payload = this.resolvePayload(request.body, options.payloadPath);

      if (payload !== undefined) {
        return of(await this.asyncService.startProcess(payload));
      }

      throw new BadRequestException(
        options.payloadPath
          ? `Payload field "${options.payloadPath}" is required`
          : 'Request body is required'
      );
    }

    return next.handle();
  }

  private resolvePayload(body: unknown, payloadPath?: string): unknown {
    if (!payloadPath) {
      return body;
    }

    if (!body || typeof body !== 'object') {
      return undefined;
    }

    return payloadPath.split('.').reduce<unknown>((value, key) => {
      if (!value || typeof value !== 'object') {
        return undefined;
      }

      return (value as Record<string, unknown>)[key];
    }, body);
  }
}
