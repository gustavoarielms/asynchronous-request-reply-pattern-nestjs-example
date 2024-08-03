import { Inject, Injectable } from '@nestjs/common';
import { IBusinessInteractor } from '../../interfaces/interactors/business.interface';
import { IBusinessService } from '../../interfaces/services/business-service.interface';
import { IAsyncPatternStartProcess } from 'src/interfaces/services/async-pattern-service/async-pattern-start-process.interface';


@Injectable()
export class BusinessInteractor implements IBusinessInteractor {
  constructor(
    @Inject('IBusinessService') private readonly businessService: IBusinessService,
    @Inject('IAsyncPatternStartProcess') private readonly asyncPatternService: IAsyncPatternStartProcess
  ) {
    console.log("constructor");
  }

  async save(data: any): Promise<any> {

    
    // Lógica de negocio antes de llamar al servicio asincrónico
    console.log('Processing data in the interactor:', data);

    // Llamada al servicio asincrónico
    const result = await this.asyncPatternService.startProcess(await this.businessService.processData(data));

    // Lógica de negocio después de la llamada al servicio asincrónico
    console.log('Result from async service:', result);

    return result;
  }
}