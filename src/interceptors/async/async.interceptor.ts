import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
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
        const serviceResponse = await this.asyncService.startProcess(request.body.data);
        return of(serviceResponse); // Retorna la respuesta del servicio directamente
      } else {
        throw new BadRequestException('Data field is required');
      }
    }

    return next.handle();
  }
}
