import { Controller, Get, Param, Inject } from '@nestjs/common';
import { AsyncStatusResponse } from '../../interfaces/http/async/async-status-response.interface';
import { IAsyncPatternGetStatus } from '../../interfaces/services/async-pattern-service/async-pattern-get-status.interface';

@Controller('async-status')
export class AsyncStatusController {
  constructor(
    @Inject('IAsyncPatternGetStatus') private readonly asyncService: IAsyncPatternGetStatus
  ) {}

  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<AsyncStatusResponse> {
    const response = await this.asyncService.getStatus(id);
    console.log(`Job: ${id}, ${response.status}`);
    return response;
  }
}
