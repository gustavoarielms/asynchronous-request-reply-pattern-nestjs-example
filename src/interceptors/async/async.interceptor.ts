import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IAsyncService } from '../../interfaces/async-service.interface';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  constructor(
    @Inject('IAsyncService') private readonly asyncService: IAsyncService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const externalMethod = this.reflector.get<() => Promise<any>>('externalMethod', context.getHandler());

    if (request.method !== 'GET') {
      if (request.body.data && externalMethod) {
        // Pasar el método externo al servicio
        const serviceResponse = await this.asyncService.startProcess(request.body.data, externalMethod);
        return of(serviceResponse); // Retorna la respuesta del servicio directamente
      } else {
        throw new BadRequestException('Data field is required');
      }
    }

    return next.handle();
  }
}
