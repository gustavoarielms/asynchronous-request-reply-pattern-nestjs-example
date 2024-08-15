import { IBusinessService } from '../../interfaces/services/business-service.interface';
import * as fs from 'fs';
import * as path from 'path';

export class BusinessService implements IBusinessService  {

  async save(data: any): Promise<any>{
    console.log(data.data);
    const filePath = path.join(__dirname, 'output.txt');
    await new Promise(resolve => setTimeout(resolve, data.data.milliseconds));
    // Guardar en un archivo
    console.log(data.data.name);
    fs.writeFileSync(filePath, data.data.name);
    return `Processed data: ${data.data.name}`;
  }
}