import { Controller, Get, Inject, Param, Type } from '@nestjs/common';
import { ASYNC_PATTERN_GET_STATUS } from '../async.tokens';
import { AsyncStatusResponse } from '../interfaces/http/async-status-response.interface';
import { IAsyncPatternGetStatus } from '../interfaces/services/async-pattern-get-status.interface';

export function createAsyncStatusController(statusBasePath: string): Type<unknown> {
  @Controller(statusBasePath)
  class AsyncStatusController {
    constructor(
      @Inject(ASYNC_PATTERN_GET_STATUS)
      private readonly asyncService: IAsyncPatternGetStatus
    ) {}

    @Get('status/:id')
    async getStatus(@Param('id') id: string): Promise<AsyncStatusResponse> {
      return this.asyncService.getStatus(id);
    }
  }

  return AsyncStatusController;
}
