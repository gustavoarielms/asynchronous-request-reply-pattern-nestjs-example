# Host Processor Contract

The library does not implement any business worker for you. It only:

- accepts the HTTP request
- enqueues the payload in BullMQ
- tracks job status
- optionally exposes the polling endpoint

The consuming application is still responsible for the background processor that handles the queued work.

## Status Store Contract

The status persistence layer is explicit in the library contract:

- token: `ASYNC_STATUS_STORE`
- interface: `IAsyncStatusStore`
- default implementation: Redis-backed, reusing the BullMQ connection already configured by the host app
- status results: JSON-like values such as strings, numbers, booleans, arrays, objects, or `null`

Most consumers should keep that default. If they need a different backing store, they can replace it with their own injectable class:

```ts
import { Injectable } from '@nestjs/common';
import {
  AsyncLibraryModule,
  AsyncStatusResponse,
  IAsyncStatusStore,
} from '@gustavoarielms/nestjs-async-request-reply';

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

## Minimum Host Responsibilities

At minimum, the host application must provide:

1. a BullMQ worker bound to the same queue name used by `AsyncLibraryModule.forRoot(...)`
2. business logic that processes `job.data`
3. if it does not use the library status controller, its own HTTP status endpoint

The example app does exactly that:

- [example-async.module.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/apps/example/src/example/example-async.module.ts) configures BullMQ and imports `AsyncLibraryModule`
- [business.interactor.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/apps/example/src/example/interactors/business.interactor.ts) is the BullMQ worker
- [business.service.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/apps/example/src/example/services/business.service.ts) contains the example business logic

## Minimal Processor Example

```ts
import { Inject, Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export interface OrdersService {
  createOrder(data: unknown): Promise<unknown>;
}

@Processor('async')
@Injectable()
export class OrdersProcessor extends WorkerHost {
  constructor(
    @Inject('OrdersService')
    private readonly ordersService: OrdersService
  ) {
    super();
  }

  process(job: Job<unknown, unknown>): Promise<unknown> {
    return this.ordersService.createOrder(job.data);
  }
}
```

## Queue And Job Alignment

If the host changes the queue name, it must keep both sides aligned:

```ts
AsyncLibraryModule.forRoot({
  queueName: 'orders',
})
```

```ts
@Processor('orders')
export class OrdersProcessor extends WorkerHost {
  // ...
}
```

The job name can also be configured explicitly:

```ts
AsyncLibraryModule.forRoot({
  queueName: 'orders',
  jobName: 'orders.create',
})
```

That value becomes the BullMQ job name passed to `queue.add(...)`. The default worker pattern in this repository still processes jobs by queue, not by `job.name`, so changing `jobName` does not require extra worker code unless the host application wants to branch on `job.name`.

Recommended rule of thumb:

- simple host app: ignore `job.name` and process the queue directly
- shared queue with multiple job kinds: route or validate by `job.name`

In short: the library owns the async HTTP pattern and status contract; the host application owns the actual background business work.
