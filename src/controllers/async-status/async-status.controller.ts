import { Controller, Get, Param } from '@nestjs/common';
import { AsyncService } from '../../services/async/async.service';

@Controller('async')
export class AsyncStatusController {
  constructor(private readonly asyncService: AsyncService) {}

  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<any> {
    return await this.asyncService.getStatus(id);
  }
}