import { Controller, Post, Body, Get, Param, HttpCode, Inject } from '@nestjs/common';
import { Async } from '../../decorators/async/async.decorator';
import { IAsyncService } from '../../interfaces/async-service.interface';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService
  ) {}

  @Post('request')
  @Async()
  @HttpCode(202)
  async handleRequest(@Body() body: any): Promise<{ status: string; location: string }> {
    const response = await this.asyncService.startProcess(body.data);
    return response;
  }
}