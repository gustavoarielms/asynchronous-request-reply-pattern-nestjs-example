import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Async } from '../../lib/async/decorators/async.decorator';
import { AsyncAcceptedResponse } from '../../lib/async/interfaces/http/async-accepted-response.interface';
import { AsyncRequestBody } from '../../lib/async/interfaces/http/async-request-body.interface';

@Controller('async')
export class ExampleAsyncController {
  @Post('save')
  @Async()
  @HttpCode(202)
  async handleRequest(@Body() _body: AsyncRequestBody): Promise<AsyncAcceptedResponse> {
    return undefined;
  }
}
