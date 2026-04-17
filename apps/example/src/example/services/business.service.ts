import { Injectable } from '@nestjs/common';
import { AsyncRequestData } from '../../../../../src/lib/async/interfaces/http/async-request-body.interface';
import { IBusinessService } from '../interfaces/services/business-service.interface';
import * as fs from 'fs';
import * as path from 'path';

const EXAMPLE_OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'example-output');

@Injectable()
export class BusinessService implements IBusinessService {
  async save(data: AsyncRequestData): Promise<string> {
    console.log(data);
    await new Promise(resolve => setTimeout(resolve, data.milliseconds));

    if (data.name === 'fail' || data.name.startsWith('fail:')) {
      throw new Error(`Simulated example failure for ${data.name}`);
    }

    fs.mkdirSync(EXAMPLE_OUTPUT_DIR, { recursive: true });
    const filePath = path.join(EXAMPLE_OUTPUT_DIR, 'output.txt');
    console.log(data.name);
    fs.writeFileSync(filePath, data.name);
    return `Processed data: ${data.name}`;
  }
}
