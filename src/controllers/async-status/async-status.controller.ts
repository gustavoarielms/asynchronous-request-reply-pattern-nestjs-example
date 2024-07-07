import { Controller, Get, Param, Inject } from '@nestjs/common';
import { IAsyncService } from '../../interfaces/async-service.interface';

@Controller('async')
export class AsyncStatusController {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService
  ) {}

  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<any> {
    return await this.asyncService.getStatus(id);
  }
}