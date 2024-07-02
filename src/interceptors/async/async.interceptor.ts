import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IAsyncService } from 'src/interfaces/async-service.interface';

@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (request.method !== 'GET') {
      if (request.body.data) {
        const requestId = await this.asyncService.startProcess(request.body.data);
        request.headers['x-request-id'] = requestId;
      } else {
        throw new BadRequestException('Data field is required');
      }
    }

    return next.handle().pipe(
      tap(() => {
        console.log(`Request ${request.method} to ${request.url} processed with requestId ${request.headers['x-request-id']}`);
      }),
    );
  }
}