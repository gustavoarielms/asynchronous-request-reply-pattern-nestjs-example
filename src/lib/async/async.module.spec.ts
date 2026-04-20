import { Injectable, Provider } from '@nestjs/common';
import { ASYNC_STATUS_STORE } from './async.tokens';
import { AsyncLibraryModule } from './async.module';
import { AsyncStatusResponse } from './interfaces/http/async-status-response.interface';
import { IAsyncStatusStore } from './interfaces/services/async-status-store.interface';

@Injectable()
class CustomStatusStore implements IAsyncStatusStore {
  get(_jobId: string): Promise<AsyncStatusResponse | null> {
    return Promise.resolve(null);
  }

  setAccepted(_jobId: string): Promise<void> {
    return Promise.resolve();
  }

  setActive(_jobId: string): Promise<void> {
    return Promise.resolve();
  }

  setCompleted(_jobId: string, _result: string): Promise<void> {
    return Promise.resolve();
  }

  setFailed(_jobId: string, _result: string): Promise<void> {
    return Promise.resolve();
  }
}

describe('AsyncLibraryModule', () => {
  it('should register the configured status store class behind the public token', () => {
    const dynamicModule = AsyncLibraryModule.forRoot({
      statusStoreClass: CustomStatusStore,
    });

    const providers = dynamicModule.providers as Provider[];

    expect(providers).toContain(CustomStatusStore);
    expect(providers).toContainEqual({
      provide: ASYNC_STATUS_STORE,
      useExisting: CustomStatusStore,
    });
  });
});
