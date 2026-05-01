# Host Processor Contract

The library does not implement any business worker for you. It only:

- accepts the HTTP request
- enqueues the payload in BullMQ
- tracks job status
- optionally exposes the polling endpoint

The consuming application is still responsible for the background processor that handles the queued work.
The library now ships `AsyncJobProcessor` as a reusable base class so the host does not need to reimplement status transitions around job execution.

The status persistence layer has its own dedicated reference in [status-store.md](status-store.md). This document focuses on the worker and processor responsibilities of the host application.

## Minimum Host Responsibilities

At minimum, the host application must provide:

1. a BullMQ worker bound to the same queue name used by `AsyncLibraryModule.forRoot(...)`
2. business logic that processes `job.data`
3. if it does not use the library status controller, its own HTTP status endpoint

The example app does exactly that:

- [example-async.module.ts](../apps/example/src/example/example-async.module.ts) configures BullMQ and imports `AsyncLibraryModule`
- [business.interactor.ts](../apps/example/src/example/interactors/business.interactor.ts) is the BullMQ worker
- [business.service.ts](../apps/example/src/example/services/business.service.ts) contains the example business logic

## Resolver Processor

Use this mode when the job can finish inside the BullMQ worker itself.

For the smallest host-side worker, extend `AsyncJobProcessor` and implement only `resolve(...)`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  ASYNC_STATUS_STORE,
  AsyncJobProcessor,
  IAsyncStatusStore,
} from 'nestjs-async-request-reply';

export interface OrdersService {
  createOrder(data: unknown): Promise<unknown>;
}

@Processor('async')
@Injectable()
export class OrdersProcessor extends AsyncJobProcessor<unknown, unknown> {
  constructor(
    @Inject('OrdersService') private readonly ordersService: OrdersService,
    @Inject(ASYNC_STATUS_STORE) asyncStatusStore: IAsyncStatusStore
  ) {
    super(asyncStatusStore);
  }

  protected resolve(payload: unknown, _job: Job<unknown, unknown>): Promise<unknown> {
    return this.ordersService.createOrder(payload);
  }
}
```

`AsyncJobProcessor` standardizes:

- `active` before business execution
- `completed` with the returned result
- `failed` with a normalized error message before rethrowing

The host still owns the worker registration, queue binding, and business logic itself.

## External Wait Processor

Use this mode when the first job starts work in another system and must wait for a later signal, such as a webhook, event bus message, or callback from another service.

Do not keep the BullMQ worker blocked while waiting for that signal. The initial job should start the external work, store a `waiting_external` status, and finish. A later webhook or message should enqueue a continuation job or update the same process status.

The processor opts into that behavior by overriding `getExecutionMode(...)` and implementing `startExternal(...)`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  ASYNC_STATUS_STORE,
  AsyncExecutionMode,
  AsyncJobProcessor,
  IAsyncStatusStore,
} from 'nestjs-async-request-reply';

export interface OrdersService {
  createOrder(data: unknown): Promise<string>;
}

export interface ExternalProvider {
  startOrder(data: unknown): Promise<{ correlationId: string }>;
  fetchResult(correlationId: string): Promise<string>;
}

type OrderPayload = {
  mode?: 'direct' | 'external';
};

@Processor('async')
@Injectable()
export class OrdersProcessor extends AsyncJobProcessor<OrderPayload, string> {
  constructor(
    @Inject('OrdersService') private readonly ordersService: OrdersService,
    @Inject('ExternalProvider') private readonly externalProvider: ExternalProvider,
    @Inject(ASYNC_STATUS_STORE) asyncStatusStore: IAsyncStatusStore
  ) {
    super(asyncStatusStore);
  }

  protected getExecutionMode(payload: OrderPayload): AsyncExecutionMode {
    return payload.mode === 'external' ? 'wait_external' : 'resolve_now';
  }

  protected async startExternal(payload: OrderPayload, job: Job<OrderPayload, string>): Promise<string> {
    const external = await this.externalProvider.startOrder(payload);

    // Persist this mapping in your application store so the webhook can find the original process.
    await this.saveCorrelation({
      jobId: String(job.id),
      correlationId: external.correlationId,
    });

    return 'Waiting for external provider';
  }

  protected resolve(payload: OrderPayload, _job: Job<OrderPayload, string>): Promise<string> {
    return this.ordersService.createOrder(payload);
  }

  private saveCorrelation(_data: { jobId: string; correlationId: string }): Promise<void> {
    throw new Error('Implement this in the host application');
  }
}
```

When `getExecutionMode(...)` returns `wait_external`, `AsyncJobProcessor`:

- sets the job status to `active`
- runs `startExternal(...)`
- stores `waiting_external` with the returned message, or `Waiting for external response` when no message is returned
- returns `undefined` from the BullMQ processor so the initial worker execution ends

The polling response then looks like:

```json
{
  "status": "waiting_external",
  "result": "Waiting for external provider",
  "completed": false
}
```

BullMQ may mark the initial technical job as completed after `startExternal(...)` returns. The library status endpoint preserves `waiting_external` because the business process is still open.

## Completing External Work

The external callback should enter the application through its own controller or message consumer. Treat that callback as a new message, not as a reason to keep the first worker alive.

Typical webhook flow:

```text
POST /orders
  -> async job starts external operation
  -> status becomes waiting_external

POST /webhooks/provider
  -> validate webhook
  -> find the original job/process by correlationId
  -> enqueue a continuation job or complete the stored status
```

A minimal continuation worker can be a regular BullMQ processor that fetches the final data and marks the original job as completed through `IAsyncStatusStore`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ASYNC_STATUS_STORE, IAsyncStatusStore } from 'nestjs-async-request-reply';

type CompleteExternalPayload = {
  jobId: string;
  correlationId: string;
};

@Processor('async')
@Injectable()
export class CompleteExternalOrderProcessor extends WorkerHost {
  constructor(
    @Inject('ExternalProvider') private readonly externalProvider: ExternalProvider,
    @Inject(ASYNC_STATUS_STORE) private readonly asyncStatusStore: IAsyncStatusStore
  ) {
    super();
  }

  async process(job: Job<CompleteExternalPayload>): Promise<string> {
    const result = await this.externalProvider.fetchResult(job.data.correlationId);

    await this.asyncStatusStore.setCompleted(job.data.jobId, result);

    return result;
  }
}
```

If the webhook contains the final result already, the webhook handler can call `setCompleted(...)` directly after validation. Enqueue a continuation job when fetching or processing the final result may be slow, retryable, or failure-prone.

## Choosing A Mode

Use `resolve(...)` only when the worker has everything it needs to finish the business operation now.

Use `getExecutionMode(...)` plus `startExternal(...)` when the worker only starts an operation and another system will answer later.

Avoid long polling, sleeps, or unresolved promises inside `startExternal(...)`. That keeps a worker occupied and makes restarts, timeouts, and retries harder to reason about.

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
