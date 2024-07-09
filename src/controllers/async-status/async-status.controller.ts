import { Controller, Get, Param, Inject } from '@nestjs/common';
import { IAsyncService } from '../../interfaces/async-service.interface';

@Controller('async-status')
export class AsyncStatusController {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService
  ) {}

  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<any> {
    var response = await this.asyncService.getStatus(id);
    console.log(response);
    console.log(`Job: ${id}, ${response.status}`);
    return response;
  }
}