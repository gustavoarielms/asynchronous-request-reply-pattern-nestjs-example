import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AsyncInterceptor } from '../interceptors/async.interceptor';

export function Async() {
  return applyDecorators(
    SetMetadata('async', true),
    UseInterceptors(AsyncInterceptor),
  );
}
