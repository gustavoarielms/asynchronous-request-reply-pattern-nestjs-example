# Status Store

The library persists job status through an explicit contract.

## Public Contract

- token: `ASYNC_STATUS_STORE`
- interface: `IAsyncStatusStore`
- default implementation: Redis-backed, reusing the BullMQ connection already configured by the host app
- status results: JSON-like values such as strings, numbers, booleans, arrays, objects, or `null`

## Default Behavior

Most consumers should keep the default Redis-backed implementation.

The default store:

- uses the same Redis connection already configured for BullMQ
- keeps status records for 24 hours by default
- is used by the library core and by the example worker through the public contract

## Replacing The Store

If the host needs a different backing store, it can replace it with its own injectable class:

```ts
import { Injectable } from '@nestjs/common';
import {
  AsyncLibraryModule,
  AsyncStatusResponse,
  IAsyncStatusStore,
} from 'nestjs-async-request-reply';

@Injectable()
export class CustomStatusStore implements IAsyncStatusStore {
  get(_jobId: string): Promise<AsyncStatusResponse | null> {
    throw new Error('Not implemented');
  }

  setAccepted(_jobId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  setActive(_jobId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  setCompleted(_jobId: string, _result: unknown): Promise<void> {
    throw new Error('Not implemented');
  }

  setFailed(_jobId: string, _result: unknown): Promise<void> {
    throw new Error('Not implemented');
  }
}

AsyncLibraryModule.forRoot({
  statusStoreClass: CustomStatusStore,
})
```

## Retention

If the default Redis-backed store is good enough but the retention window is not, the host can configure it directly:

```ts
AsyncLibraryModule.forRoot({
  statusTtlSeconds: 60 * 60,
})
```

That keeps job status records for one hour instead of the default 24 hours.

If the host wants the default store to keep status records without automatic expiration, it can disable the TTL explicitly:

```ts
AsyncLibraryModule.forRoot({
  statusTtlSeconds: null,
})
```
