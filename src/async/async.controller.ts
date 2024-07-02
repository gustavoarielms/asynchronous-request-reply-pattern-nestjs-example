import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AsyncService } from './async.service';

@Controller('async')
export class AsyncController {
  constructor(private readonly asyncService: AsyncService) {}

  @Post('request')
  @HttpCode(202)
  async handleRequest(@Body() body: any): Promise<{ status: string; location: string }> {
    const requestId = await this.asyncService.startProcess(body.data);
    return {
      status: 'Accepted',
      location: `/async/status/${requestId}`,
    };
  }
}