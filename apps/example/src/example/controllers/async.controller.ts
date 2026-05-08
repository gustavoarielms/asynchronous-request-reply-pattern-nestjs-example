import { Body, Controller, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { ASYNC_STATUS_STORE } from '../../../../../src/lib/async/async.tokens';
import { Async } from '../../../../../src/lib/async/decorators/async.decorator';
import { AsyncAcceptedResponse } from '../../../../../src/lib/async/interfaces/http/async-accepted-response.interface';
import { IAsyncStatusStore } from '../../../../../src/lib/async/interfaces/services/async-status-store.interface';
import { AsyncRequestBody, WebhookRequestBody } from '../interfaces/http/async-request-body.interface';

@Controller('async')
export class ExampleAsyncController {
  constructor(@Inject(ASYNC_STATUS_STORE) private readonly asyncStatusStore: IAsyncStatusStore) {}

  @Post('save')
  @Async({ payloadPath: 'data' })
  @HttpCode(202)
  async handleRequest(@Body() _body: AsyncRequestBody): Promise<AsyncAcceptedResponse> {
    return undefined;
  }

  @Post('webhook/:id')
  @HttpCode(204)
  async handleWebhook(@Param('id') id: string, @Body() body: WebhookRequestBody): Promise<void> {
    await this.asyncStatusStore.setCompleted(id, body.result);
  }
}
