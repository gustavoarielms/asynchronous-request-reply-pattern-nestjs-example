import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Async } from '../../../../../src/lib/async/decorators/async.decorator';
import { AsyncAcceptedResponse } from '../../../../../src/lib/async/interfaces/http/async-accepted-response.interface';
import { AsyncRequestBody } from '../interfaces/http/async-request-body.interface';

@Controller('async')
export class ExampleAsyncController {
  @Post('save')
  @Async({ payloadPath: 'data' })
  @HttpCode(202)
  async handleRequest(@Body() _body: AsyncRequestBody): Promise<AsyncAcceptedResponse> {
    return undefined;
  }
}
