import { Injectable } from '@nestjs/common';
import { AsyncRequestData } from '../../../../../src/lib/async/interfaces/http/async-request-body.interface';
import { IBusinessService } from '../interfaces/services/business-service.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BusinessService implements IBusinessService {
  async save(data: AsyncRequestData): Promise<string> {
    console.log(data);
    await new Promise(resolve => setTimeout(resolve, data.milliseconds));

    if (data.name === 'fail' || data.name.startsWith('fail:')) {
      throw new Error(`Simulated example failure for ${data.name}`);
    }

    const filePath = path.join(__dirname, 'output.txt');
    console.log(data.name);
    fs.writeFileSync(filePath, data.name);
    return `Processed data: ${data.name}`;
  }
}
