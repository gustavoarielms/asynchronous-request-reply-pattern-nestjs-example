import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ASYNC_PATTERN_GET_STATUS } from '../../lib/async/async.tokens';
import { AsyncStatusResponse } from '../../lib/async/interfaces/http/async-status-response.interface';
import { IAsyncPatternGetStatus } from '../../lib/async/interfaces/services/async-pattern-get-status.interface';

@Controller('async-status')
export class ExampleAsyncStatusController {
  constructor(
    @Inject(ASYNC_PATTERN_GET_STATUS)
    private readonly asyncService: IAsyncPatternGetStatus
  ) {}

  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<AsyncStatusResponse> {
    const response = await this.asyncService.getStatus(id);
    console.log(`Job: ${id}, ${response.status}`);
    return response;
  }
}
