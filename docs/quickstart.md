# Quickstart

This is the shortest end-to-end setup to use the package in a host NestJS application.

## 1. Install

```bash
npm install nestjs-async-request-reply
```

## 2. Configure BullMQ And The Library Module

```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AsyncLibraryModule } from 'nestjs-async-request-reply';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
      },
    }),
    AsyncLibraryModule.forRoot({
      exposeStatusController: true,
    }),
  ],
})
export class AppModule {}
```

That gives you:

- the async request-reply wiring
- the default status controller
- a public polling route at `GET /async-status/status/:id`

## 3. Mark An Endpoint As Async

```ts
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Async, AsyncAcceptedResponse } from 'nestjs-async-request-reply';

@Controller('orders')
export class OrdersController {
  @Post()
  @Async()
  @HttpCode(202)
  createOrder(@Body() _body: unknown): Promise<AsyncAcceptedResponse> {
    return undefined;
  }
}
```

With the default behavior, the full request body becomes the job payload.

If the host wants a nested payload instead:

```ts
@Async({ payloadPath: 'data' })
```

## 4. Add A Worker

The library does not implement business processing for you. The host app must still provide a BullMQ worker:

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
  createOrder(data: unknown): Promise<string>;
}

@Processor('async')
@Injectable()
export class OrdersProcessor extends AsyncJobProcessor<unknown, string> {
  constructor(
    @Inject('OrdersService') private readonly ordersService: OrdersService,
    @Inject(ASYNC_STATUS_STORE) asyncStatusStore: IAsyncStatusStore
  ) {
    super(asyncStatusStore);
  }

  protected handle(payload: unknown, _job: Job<unknown, string>): Promise<string> {
    return this.ordersService.createOrder(payload);
  }
}
```

Important:

- the worker queue name must match the module `queueName`
- if you change `queueName`, change `@Processor(...)` too

## 5. Start Work

Example request:

```bash
curl -i \
  -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "123",
    "total": 99.5
  }'
```

Example accepted response:

```json
{
  "status": "accepted",
  "location": "/async-status/status/1"
}
```

## 6. Poll Status

```bash
curl http://localhost:3000/async-status/status/1
```

Typical responses:

```json
{
  "status": "waiting",
  "result": "Processing",
  "completed": false
}
```

```json
{
  "status": "completed",
  "result": "Processed",
  "completed": true
}
```

## 7. Next Docs

After the basic setup works:

- module options: [module-options.md](module-options.md)
- status endpoint contract: [status-endpoint.md](status-endpoint.md)
- host worker responsibilities: [host-processor-contract.md](host-processor-contract.md)
- status store contract: [status-store.md](status-store.md)
