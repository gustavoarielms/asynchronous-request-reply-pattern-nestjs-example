# Asynchronous Request-Reply Pattern with NestJS

Example NestJS application that implements the [Asynchronous Request-Reply pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply) with BullMQ and Redis.

The API accepts a request, enqueues the work, responds with `202 Accepted`, and exposes a polling endpoint to check the job status later.

The repository now also exposes the reusable async core as an npm package entrypoint from [src/lib/async/index.ts](src/lib/async/index.ts).

If you want the shortest integration path first, start with [docs/quickstart.md](docs/quickstart.md).
The current stability contract for the package is documented in [docs/stability-contract.md](docs/stability-contract.md).

## License

This project is available under the [MIT License](LICENSE).

## Package output

The publishable package is built from the reusable library code only:

```bash
npm run build:package
npm run pack:dry-run
```

The package entrypoint resolves to:

- [dist/lib/async/index.js](dist/lib/async/index.js)
- [dist/lib/async/index.d.ts](dist/lib/async/index.d.ts)

Typical consumer usage:

```ts
import { AsyncLibraryModule, Async } from 'nestjs-async-request-reply';
```

The package entrypoint is intentionally narrow. It exposes the module, decorator, public response contracts, and DI-facing interfaces and tokens. Internal implementation details such as the interceptor and concrete services stay out of the public API.

The intended public surface is:

- `AsyncLibraryModule`
- `Async`
- `AsyncModuleOptions`
- `AsyncOptions`
- `AsyncAcceptedResponse`
- `AsyncStatusResponse`
- `IAsyncExternalStatusResolver`
- `AsyncJobProcessor`
- `AsyncExecutionMode`
- `IAsyncPatternGetStatus`
- `IAsyncPatternStartProcess`
- `IAsyncStatusStore`
- `ASYNC_PATTERN_GET_STATUS`
- `ASYNC_STATUS_STORE`

Internal wiring tokens and controller factories are not part of the package contract.

## Library wiring

The host application is responsible for the global BullMQ/Redis connection:

```ts
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
})
```

The library module sits on top of that global BullMQ setup:

```ts
AsyncLibraryModule.forRoot({
  queueName: 'async',
  jobName: 'processJob',
})
```

In other words:

- `BullModule.forRoot(...)` belongs to the consuming application and owns the Redis connection.
- `AsyncLibraryModule.forRoot(...)` belongs to the library and registers its queue wiring, services, and defaults.
- The library does not create or own the global BullMQ/Redis connection by itself.
- `jobName` controls the BullMQ job name used when the library enqueues work.
- The library uses a status store contract internally and ships a Redis-backed implementation by default.

The complete option reference now lives in [docs/module-options.md](docs/module-options.md).
The status store contract and retention behavior are documented in [docs/status-store.md](docs/status-store.md).

## npm

This library is prepared to publish to npm as:

```text
nestjs-async-request-reply
```

Consumers can install it with:

```bash
npm install nestjs-async-request-reply
```

Security note:

- the package currently targets BullMQ `5.76.2` and newer compatible patch releases
- consumers should avoid the previously used `5.74.1` line

To publish it manually from this repository:

```bash
npm login
npm run build:package
npm run publish:npm
```

The repository also includes [publish-package.yml](.github/workflows/publish-package.yml), which can publish the package to npm when triggered manually.

## Release automation

The repository also includes [release-please.yml](.github/workflows/release-please.yml), powered by [release-please](https://github.com/googleapis/release-please).

The intended flow is:

1. merge regular changes into `main`
2. release-please opens or updates a release PR
3. merge that release PR
4. the same [release-please.yml](.github/workflows/release-please.yml) run creates the Git tag and GitHub Release
5. when that same run actually creates a release, it checks out the release tag, builds the package, and publishes it to npm

The initial release manifest lives in [release-please-config.json](release-please-config.json) and [.release-please-manifest.json](.release-please-manifest.json).
Release hygiene expectations for changelog quality, breaking changes, and migration notes are documented in [docs/release-hygiene.md](docs/release-hygiene.md).

## Contribution flow

Branch naming, PR targeting, and PR title guidance for this repository are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

## How it works

The flow in this project is:

1. `POST /async/save` receives the request body.
2. `AsyncInterceptor` extracts the job payload from the request body and delegates to `AsyncPatternService`.
3. `AsyncPatternService` adds the job to the BullMQ queue and returns a polling location.
4. `BusinessInteractor` consumes the job in the background.
5. `GET /async-status/status/:id` returns the current job status.

In this repository, the example controller configures `payloadPath: 'data'`, so the example request body still wraps the payload under `data`. The library default is more generic: `@Async()` uses the full request body as the enqueued payload.

### Explicit payload validation and transformation

`@Async()` completes the asynchronous HTTP flow without invoking the route handler. Pipes declared on `@Body()` and global pipes are therefore not automatically reused. Configure an explicit pipe instance when the job payload must be validated or transformed:

```ts
import { ValidationPipe } from '@nestjs/common';

@Post('orders')
@Async({
  payloadPath: 'data',
  pipe: new ValidationPipe({
    transform: true,
    whitelist: true,
    expectedType: CreateOrderDto,
  }),
})
@HttpCode(202)
createOrder(@Body() _body: unknown): Promise<AsyncAcceptedResponse> {
  return undefined;
}
```

The pipe runs after `payloadPath` is resolved; without `payloadPath`, it receives the full body. Only the returned value is passed to BullMQ. A class-validator-backed `ValidationPipe` must set `expectedType` because the explicit invocation has no route-parameter metatype. The host application must install `class-validator` and `class-transformer` when using that validation stack.

`pipe` accepts an already constructed `PipeTransform` instance. Classes and injection tokens are not resolved through Nest dependency injection. HTTP exceptions preserve their status and prevent enqueueing; arbitrary errors follow Nest's normal HTTP 500 handling and also prevent enqueueing. Omitting `pipe` preserves the previous behavior. Guards still execute before the interceptor.

`AsyncLibraryModule.forRoot(...)` can also expose the default polling controller from the library itself. The example app enables it with:

```ts
AsyncLibraryModule.forRoot({
  exposeStatusController: true,
  statusBasePath: 'async-status',
})
```

That keeps the polling endpoint in the reusable core instead of duplicating a controller in each host app.

The full status endpoint contract, including custom controllers, `statusLocationBasePath`, and polling responses, now lives in [docs/status-endpoint.md](docs/status-endpoint.md).

## Host background worker contract

The library does not implement business processing workers. It only accepts the HTTP request, enqueues payloads, tracks status, and optionally exposes the polling endpoint.

The host application still owns:

- the BullMQ worker bound to the configured queue
- the business logic that consumes `job.data`
- any custom HTTP status endpoint when the default one is disabled

The full contract, examples, and guidance for `queueName`, `jobName`, and custom status stores now live in [docs/host-processor-contract.md](docs/host-processor-contract.md).

In short: the library owns the async HTTP pattern and status contract; the host application owns the actual background business work.

Host processors can use two execution modes:

- implement `resolve(...)` for jobs that can complete inside the worker
- override `getExecutionMode(...)` and implement `startExternal(...)` for jobs that start work in another system and wait for a later webhook or message

The external wait mode stores `waiting_external` and lets the initial BullMQ job finish without blocking the worker. The webhook or external event should enqueue a continuation job or update the original status when the external work is done.

If the webhook may be lost, the host can configure `externalStatusResolverClass` as an optional failover. While the stored status is `waiting_external`, the status endpoint can ask the external provider for the final state and persist `completed` or `failed` when the provider has a terminal answer.

By default, the decorator only allows `POST`, `PUT`, and `PATCH`. Exceptional cases such as `GET` must be enabled explicitly with `allowMethods`, for example `@Async({ allowMethods: ['GET'] })`.

Exceptional legacy case only. Do not use this pattern for new endpoints:

```ts
// Exceptional legacy case only. Do not use this pattern for new endpoints.
@Get('legacy-report')
@Async({ allowMethods: ['GET'], payloadPath: 'query' })
getLegacyReport(@Query() _query: Record<string, string>) {
  return undefined;
}
```

That kind of endpoint should be treated as an exception or legacy-compatibility escape hatch when you are stuck with an inherited or poorly designed contract that cannot be changed easily. In general, async work that enqueues jobs and changes backend state should use `POST`, `PUT`, or `PATCH`, not `GET`.

The sample business operation waits for the requested number of milliseconds and then writes the provided name into `tmp/example-output/output.txt`.

## Prerequisites

- Node.js 20.11 or newer and npm
- Redis running locally or reachable from the app

By default the app expects Redis at:

- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`

Optional:

- `REDIS_PASSWORD`

## Installation

```bash
npm install
```

## Local Redis with Docker

```bash
npm run redis:up
```

To stop it:

```bash
npm run redis:down
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build
npm run build
npm run start:prod
```

The app listens on `http://localhost:3000` by default. You can override it with `PORT`.

## HTTP contract

### Start async work

`POST /async/save`

Request body:

```json
{
  "data": {
    "name": "example-job",
    "milliseconds": 2000
  }
}
```

Successful response:

```http
202 Accepted
```

```json
{
  "status": "accepted",
  "location": "/async-status/status/1"
}
```

Validation error:

```http
400 Bad Request
```

This happens in the example app when the request does not include the `data` field configured via `payloadPath`, or when its explicit `AsyncRequestPipe` rejects invalid data. In either case, no job is added to BullMQ.

### Check async status

`GET /async-status/status/:id`

Possible responses:

Pending job:

```json
{
  "status": "waiting",
  "result": "Processing",
  "completed": false
}
```

Completed job:

```json
{
  "status": "completed",
  "result": "Processed data: example-job",
  "completed": true
}
```

Failed job:

```json
{
  "status": "failed",
  "result": "Simulated example failure for fail:demo",
  "completed": true
}
```

Waiting for an external webhook or event:

```json
{
  "status": "waiting_external",
  "result": "Waiting for external provider",
  "completed": false
}
```

Unknown job id:

```http
404 Not Found
```

## Example flow with curl

Successful job:

```bash
curl -i \
  -X POST http://localhost:3000/async/save \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "gustavo",
      "milliseconds": 1500
    }
  }'
```

Then poll the returned location:

```bash
curl http://localhost:3000/async-status/status/1
```

Long-running job to observe `waiting` or `active` before completion:

```bash
curl -i \
  -X POST http://localhost:3000/async/save \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "slow-demo",
      "milliseconds": 10000
    }
  }'
```

Poll immediately after creating it:

```bash
curl http://localhost:3000/async-status/status/2
```

Simulated failure:

```bash
curl -i \
  -X POST http://localhost:3000/async/save \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "fail:demo",
      "milliseconds": 500
    }
  }'
```

Then poll the returned location:

```bash
curl http://localhost:3000/async-status/status/3
```

## Tests

```bash
# unit tests
npm test -- --runInBand

# e2e/integration-style tests
npm run test:e2e -- --runInBand

# full smoke test against the running example flow
npm run smoke:example

# coverage
npm run test:cov
```

`npm run smoke:example` starts the app on port `3100` by default, sends real HTTP requests to `POST /async/save`, and polls the status endpoint until it validates:

- a successful job
- a simulated failed job
- a long-running job that exposes an in-progress state before completion

If you already have the app running elsewhere, you can reuse it:

```bash
START_APP=false APP_URL=http://127.0.0.1:3000 npm run smoke:example
```

## CI

The repository includes [example-tests.yml](.github/workflows/example-tests.yml), a GitHub Actions workflow that:

- starts Redis as a service
- installs dependencies
- runs unit tests
- runs e2e tests
- builds the project
- runs the smoke test against the real example flow

## Implementation notes

- The reusable async core lives in [src/lib/async/async.module.ts](src/lib/async/async.module.ts).
- The example app wiring lives in [apps/example/src/example/example-async.module.ts](apps/example/src/example/example-async.module.ts).
- The example async entrypoint is [apps/example/src/example/controllers/async.controller.ts](apps/example/src/example/controllers/async.controller.ts).
- The optional default polling controller lives in [src/lib/async/controllers/async-status.controller.ts](src/lib/async/controllers/async-status.controller.ts).
- Queue orchestration for the reusable core lives in [src/lib/async/services/async-pattern.service.ts](src/lib/async/services/async-pattern.service.ts).
- Sample business work lives in [apps/example/src/example/services/business.service.ts](apps/example/src/example/services/business.service.ts).
