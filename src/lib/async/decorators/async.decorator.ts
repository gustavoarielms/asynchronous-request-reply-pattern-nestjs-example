import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AsyncInterceptor } from '../interceptors/async.interceptor';
import { AsyncOptions } from '../interfaces/async-options.interface';

export const ASYNC_OPTIONS = 'async:options';

export function Async(options: AsyncOptions = {}) {
  return applyDecorators(
    SetMetadata('async', true),
    SetMetadata(ASYNC_OPTIONS, options),
    UseInterceptors(AsyncInterceptor),
  );
}
