import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { AsyncInterceptor } from '../../interceptors/async/async.interceptor';

export function Async(externalMethod: (data:any) => Promise<any>) {
  return applyDecorators(
    SetMetadata('async', true),
    SetMetadata('externalMethod', externalMethod),
    UseInterceptors(AsyncInterceptor),
  );
}