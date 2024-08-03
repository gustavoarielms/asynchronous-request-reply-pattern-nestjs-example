import { Injectable } from '@nestjs/common';
import { IBusinessService } from '../../interfaces/services/business-service.interface';

@Injectable()
export class BusinessService implements IBusinessService{
  async processData(data: any): Promise<any> {
    // Simula una operación asincrónica
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `Processed: ${data}`;
  }
}