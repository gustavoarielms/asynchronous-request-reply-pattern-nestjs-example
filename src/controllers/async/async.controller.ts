import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';
import { Async } from 'src/decorators/async/async.decorator';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IAsyncPatternStartProcess') private readonly asyncService: IAsyncPatternStartProcess,
  ) {}

  @Post('save')
  @Async()
  @HttpCode(202)
  async handleRequest(@Body() body: any): Promise<{ status: string; location: string }> {
    //Todo es manejado por el interceptor async
    return;
  }
}
