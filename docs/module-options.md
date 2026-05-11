# Module Options

`AsyncLibraryModule.forRoot(...)` is the main configuration entrypoint for the package.

```ts
AsyncLibraryModule.forRoot({
  queueName: 'async',
  jobName: 'processJob',
  exposeStatusController: true,
  statusBasePath: 'async-status',
})
```

## Options

### `queueName`

BullMQ queue name used by the library.

Default:

```ts
'async'
```

The host worker must listen to the same queue:

```ts
@Processor('async')
export class OrdersProcessor extends WorkerHost {}
```

### `jobName`

BullMQ job name used when the library enqueues work with `queue.add(...)`.

Default:

```ts
'processJob'
```

This is useful when the host wants to distinguish different job kinds on the same queue.

### `defaultAllowedMethods`

Default HTTP methods allowed by `@Async()` when the decorator does not override them explicitly.

Default:

```ts
['POST', 'PUT', 'PATCH']
```

`GET` is intentionally not part of the default set. If a host needs it for a legacy case, it should opt in at the decorator level.

### `exposeStatusController`

Controls whether the library registers its default polling endpoint.

Default:

```ts
false
```

When enabled, the library exposes:

```text
GET /<statusBasePath>/status/:id
```

### `statusBasePath`

Base path used by the default status controller when `exposeStatusController` is enabled.

Default:

```ts
'async-status'
```

Example:

```ts
AsyncLibraryModule.forRoot({
  exposeStatusController: true,
  statusBasePath: 'jobs',
})
```

This produces:

```text
GET /jobs/status/:id
```

### `statusLocationBasePath`

Base path used to build the `location` returned in the accepted response.

Default behavior:

- if `exposeStatusController: true`, it defaults to `statusBasePath`
- otherwise it defaults to no public location

Example:

```ts
AsyncLibraryModule.forRoot({
  exposeStatusController: false,
  statusLocationBasePath: 'jobs',
})
```

This means the library will return:

```json
{
  "status": "accepted",
  "location": "/jobs/status/123"
}
```

but the host is still responsible for exposing that HTTP endpoint.

### `statusTtlSeconds`

TTL for records stored by the default Redis-backed status store.

Default:

```ts
60 * 60 * 24
```

That is 24 hours.

Set it explicitly to `null` to keep status records without expiration when using the default store.

### `statusStoreClass`

Custom injectable class used as the status store implementation.

Default:

- the library Redis-backed implementation

The class must implement `IAsyncStatusStore`.

Example:

```ts
AsyncLibraryModule.forRoot({
  statusStoreClass: CustomStatusStore,
})
```

### `externalStatusResolverClass`

Optional injectable class used to query an external provider when a job is still in `waiting_external`.

Default:

```ts
undefined
```

The class must implement `IAsyncExternalStatusResolver`.

When configured, `GET /<statusBasePath>/status/:id` calls the resolver only for stored `waiting_external` statuses:

- return `null` to keep waiting for the webhook
- return `completed` to persist and return the completed status
- return `failed` to persist and return the failed status

See [host-processor-contract.md](host-processor-contract.md#optional-webhook-failover) for the full example.

## Recommended Defaults

For most host applications, this is enough:

```ts
AsyncLibraryModule.forRoot({
  exposeStatusController: true,
})
```

Use more explicit options only when the host needs:

- a different queue name
- a different public status route
- a custom location path
- a custom status store
- an external provider lookup fallback while waiting for a webhook
- a specific job naming convention
