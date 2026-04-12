# Asynchronous Request-Reply Pattern with NestJS

Example NestJS application that implements the [Asynchronous Request-Reply pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply) with BullMQ and Redis.

The API accepts a request, enqueues the work, responds with `202 Accepted`, and exposes a polling endpoint to check the job status later.

## How it works

The flow in this project is:

1. `POST /async/save` receives the request body.
2. `AsyncInterceptor` validates the presence of `body.data` and delegates to `AsyncPatternService`.
3. `AsyncPatternService` adds the job to the BullMQ queue and returns a polling location.
4. `BusinessInteractor` consumes the job in the background.
5. `GET /async-status/status/:id` returns the current job status.

The sample business operation waits for the requested number of milliseconds and then writes the provided name into `output.txt`.

## Prerequisites

- Node.js and npm
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

The app listens on `http://localhost:3000`.

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

This happens when the request does not include the `data` field expected by the async interceptor.

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
  "result": "failure reason",
  "completed": true
}
```

Unknown job id:

```http
404 Not Found
```

## Example flow with curl

Create the job:

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

## Tests

```bash
# unit tests
npm test -- --runInBand

# e2e/integration-style tests
npm run test:e2e -- --runInBand

# coverage
npm run test:cov
```

## Implementation notes

- BullMQ is configured in [src/modules/async.module.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/src/modules/async.module.ts).
- The async entrypoint is [src/controllers/async/async.controller.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/src/controllers/async/async.controller.ts).
- The polling endpoint is [src/controllers/async-status/async-status.controller.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/src/controllers/async-status/async-status.controller.ts).
- Queue orchestration lives in [src/services/async/async.service.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/src/services/async/async.service.ts).
- Sample business work lives in [src/services/business/business.service.ts](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/src/services/business/business.service.ts).
