# Host Processor Contract

The library does not implement any business worker for you. It only:

- accepts the HTTP request
- enqueues the payload in BullMQ
- tracks job status
- optionally exposes the polling endpoint

The consuming application is still responsible for the background processor that handles the queued work.

The status persistence layer has its own dedicated reference in [status-store.md](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/docs/status-store.md). This document focuses on the worker and processor responsibilities of the host application.

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
