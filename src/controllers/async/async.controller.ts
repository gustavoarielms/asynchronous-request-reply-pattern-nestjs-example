import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { Async } from '../../decorators/async/async.decorator';
import { IAsyncService } from '../../interfaces/async-service.interface';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService
  ) {}

  @Post('request')
  @Async(async () => {
    // Simular una llamada externa con un retraso
    await new Promise(resolve => setTimeout(resolve, 5000));
    //return 'External method result';
  })
  @HttpCode(202)
  async handleRequest(@Body() body: any): Promise<{ status: string; location: string }> {
    return;
  }
}