import { IBusinessService } from '../../interfaces/services/business-service.interface';
import { AsyncRequestData } from '../../interfaces/http/async/async-request-body.interface';
import * as fs from 'fs';
import * as path from 'path';

export class BusinessService implements IBusinessService  {
  async save(data: AsyncRequestData): Promise<string> {
    console.log(data);
    const filePath = path.join(__dirname, 'output.txt');
    await new Promise(resolve => setTimeout(resolve, data.milliseconds));
    // Guardar en un archivo
    console.log(data.name);
    fs.writeFileSync(filePath, data.name);
    return `Processed data: ${data.name}`;
  }
}
