import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  Async,
  AsyncAcceptedResponse,
} from '@gustavoarielms/nestjs-async-request-reply';
import { PackageConsumerRequest } from '../interfaces/package-consumer-request.interface';

@Controller('consumer')
export class PackageConsumerController {
  @Post('tasks')
  @Async()
  @HttpCode(202)
  createTask(
    @Body() _body: PackageConsumerRequest
  ): Promise<AsyncAcceptedResponse> {
    return undefined;
  }
}
