# Status Endpoint

The library can expose a default polling endpoint for async jobs, or the host application can provide its own.

## Default Controller

Enable the built-in controller through `AsyncLibraryModule.forRoot(...)`:

```ts
AsyncLibraryModule.forRoot({
  exposeStatusController: true,
  statusBasePath: 'async-status',
})
```

That exposes:

```text
GET /async-status/status/:id
```

## Custom Controller

If `exposeStatusController` is `false`, the library does not register any polling route.

In that case, the host application can expose its own endpoint:

```ts
import { Controller, Get, Inject, Param } from '@nestjs/common';
import {
  ASYNC_PATTERN_GET_STATUS,
  AsyncStatusResponse,
  IAsyncPatternGetStatus,
} from 'nestjs-async-request-reply';

@Controller('jobs')
export class JobsStatusController {
  constructor(
    @Inject(ASYNC_PATTERN_GET_STATUS)
    private readonly asyncStatus: IAsyncPatternGetStatus
  ) {}

  @Get('status/:id')
  getStatus(@Param('id') id: string): Promise<AsyncStatusResponse> {
    return this.asyncStatus.getStatus(id);
  }
}
```

If the host exposes a custom public path, it should keep `statusLocationBasePath` aligned:

```ts
AsyncLibraryModule.forRoot({
  exposeStatusController: false,
  statusLocationBasePath: 'jobs',
})
```

## Accepted Response And `location`

When the library knows the public polling path, it can return:

```json
{
  "status": "accepted",
  "location": "/async-status/status/123"
}
```

If neither a default controller nor a `statusLocationBasePath` is configured, the accepted response contains only:

```json
{
  "status": "accepted"
}
```

## Status Responses

Typical polling responses are:

Pending:

```json
{
  "status": "waiting",
  "result": "Processing",
  "completed": false
}
```

Completed:

```json
{
  "status": "completed",
  "result": "Processed data: example-job",
  "completed": true
}
```

Failed:

```json
{
  "status": "failed",
  "result": "Simulated example failure for fail:demo",
  "completed": true
}
```

Unknown job:

```http
404 Not Found
```
