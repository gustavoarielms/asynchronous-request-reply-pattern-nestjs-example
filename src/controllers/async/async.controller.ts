import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IAsyncPatternStartProcess') private readonly asyncService: IAsyncPatternStartProcess,
  ) {}

  @Post('save')
  @HttpCode(202)
  async handleRequest(@Body() body: any): Promise<{ status: string; location: string }> {
    var result = await this.asyncService.startProcess(body.data);
    return result;
  }
}
