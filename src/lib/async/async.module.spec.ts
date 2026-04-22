import { Injectable, Provider } from '@nestjs/common';
import { ASYNC_MODULE_OPTIONS, ASYNC_STATUS_STORE } from './async.tokens';
import { AsyncLibraryModule } from './async.module';
import { AsyncStatusResponse, AsyncStatusResult } from './interfaces/http/async-status-response.interface';
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

  setCompleted(_jobId: string, _result: AsyncStatusResult): Promise<void> {
    return Promise.resolve();
  }

  setFailed(_jobId: string, _result: AsyncStatusResult): Promise<void> {
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

  it('should expose the configured status TTL through module options', () => {
    const dynamicModule = AsyncLibraryModule.forRoot({
      statusTtlSeconds: 3600,
    });

    const optionsProvider = (dynamicModule.providers as Provider[]).find(
      provider =>
        'provide' in provider
        && provider.provide === ASYNC_MODULE_OPTIONS
    ) as Provider & { useValue: { statusTtlSeconds: number } };

    expect(optionsProvider.useValue.statusTtlSeconds).toBe(3600);
  });

  it('should reject invalid status TTL values', () => {
    expect(() =>
      AsyncLibraryModule.forRoot({
        statusTtlSeconds: 0,
      })
    ).toThrow('statusTtlSeconds must be a positive integer or null');
  });

  it('should reject empty queue names', () => {
    expect(() =>
      AsyncLibraryModule.forRoot({
        queueName: '   ',
      })
    ).toThrow('queueName must be a non-empty string');
  });

  it('should reject empty job names', () => {
    expect(() =>
      AsyncLibraryModule.forRoot({
        jobName: '   ',
      })
    ).toThrow('jobName must be a non-empty string');
  });

  it('should reject an empty status base path when exposing the status controller', () => {
    expect(() =>
      AsyncLibraryModule.forRoot({
        exposeStatusController: true,
        statusBasePath: '/',
      })
    ).toThrow('statusBasePath must resolve to a non-empty path when exposeStatusController is true');
  });

  it('should reject invalid explicit status location base paths', () => {
    expect(() =>
      AsyncLibraryModule.forRoot({
        statusLocationBasePath: '/',
      })
    ).toThrow('statusLocationBasePath must resolve to a non-empty path');
  });
});
