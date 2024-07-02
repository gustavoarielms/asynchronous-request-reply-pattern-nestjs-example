import { Controller, Post, Body, Get, Param, HttpCode, Inject } from '@nestjs/common';
import { IAsyncService } from '../../interfaces/async-service.interface';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService
  ) {}

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