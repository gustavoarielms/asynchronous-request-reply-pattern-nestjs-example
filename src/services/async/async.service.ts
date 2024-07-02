import { Injectable } from '@nestjs/common';
import { IAsyncService } from '../../interfaces/async-service.interface';

@Injectable()
export class AsyncService implements IAsyncService {
  private readonly results = new Map<string, any>();

  async startProcess(data: any): Promise<{ status: string; location: string }> {
    const requestId = this.generateRequestId();
    // Simular un proceso asíncrono
    setTimeout(() => {
      this.results.set(requestId, { status: 'Completed', result: `Processed: ${data}` });
    }, 5000);
    return {
      status: 'Accepted',
      location: `/async/status/${requestId}`,
    };
  }

  async getStatus(requestId: string): Promise<any> {
    return this.results.get(requestId) || { status: 'Processing' };
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}