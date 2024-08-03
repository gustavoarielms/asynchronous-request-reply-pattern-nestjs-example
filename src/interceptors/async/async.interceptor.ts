import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IAsyncPatternStartProcess } from '../../interfaces/services/async-pattern-service/async-pattern-start-process.interface';

@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  constructor(
    @Inject('IAsyncPatternStartProcess') private readonly asyncService: IAsyncPatternStartProcess,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const externalMethod = this.reflector.get<() => Promise<any>>('externalMethod', context.getHandler());

    if (request.method !== 'GET') {
      if (request.body.data && externalMethod) {
        // Pasar el método externo al servicio
        const serviceResponse = await this.asyncService.startProcess(request.body.data);
        return of(serviceResponse); // Retorna la respuesta del servicio directamente
      } else {
        throw new BadRequestException('Data field is required');
      }
    }

    return next.handle();
  }
}
