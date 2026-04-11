import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { AsyncAcceptedResponse } from '../../interfaces/http/async/async-accepted-response.interface';
import { AsyncRequestBody } from '../../interfaces/http/async/async-request-body.interface';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';
import { Async } from '../../decorators/async/async.decorator';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IAsyncPatternStartProcess') private readonly asyncService: IAsyncPatternStartProcess,
  ) {}

  @Post('save')
  @Async()
  @HttpCode(202)
  async handleRequest(@Body() body: AsyncRequestBody): Promise<AsyncAcceptedResponse> {
    //Todo es manejado por el interceptor async
    return;
  }
}
