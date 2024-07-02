import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { AsyncInterceptor } from '../../interceptors/async/async.interceptor';

export function Async() {
  return applyDecorators(
    SetMetadata('async', true),
    UseInterceptors(AsyncInterceptor),
  );
}