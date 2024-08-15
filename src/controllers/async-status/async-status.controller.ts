import { Controller, Get, Param, Inject } from '@nestjs/common';
import { IAsyncPatternGetStatus } from '../../interfaces/services/async-pattern-service/async-pattern-get-status.interface';

@Controller('async-status')
export class AsyncStatusController {
  constructor(
    @Inject('IAsyncPatternGetStatus') private readonly asyncService: IAsyncPatternGetStatus
  ) {}

  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<any> {
    var response = await this.asyncService.getStatus(id);
    console.log(`Job: ${id}, ${response.status}`);
    return response;
  }
}