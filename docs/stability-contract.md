# Stability Contract

This document defines what the package currently treats as stable public API on the path to `0.1.0`.

Stable here means:

- consumers can build against it intentionally
- changes should preserve backwards compatibility whenever possible
- if a breaking change becomes necessary, it should be called out explicitly in release notes

## Stable Exports

The package entrypoint is intentionally narrow. The following exports are part of the public contract:

- `AsyncLibraryModule`
- `Async`
- `AsyncModuleOptions`
- `AsyncOptions`
- `AsyncAcceptedResponse`
- `AsyncStatusResponse`
- `AsyncJobProcessor`
- `AsyncExecutionMode`
- `IAsyncPatternGetStatus`
- `IAsyncPatternStartProcess`
- `IAsyncStatusStore`
- `ASYNC_PATTERN_GET_STATUS`
- `ASYNC_STATUS_STORE`

Consumers should treat anything not exported from the package root as internal implementation detail.

In particular, these are not part of the public contract:

- internal wiring tokens other than the documented public tokens
- controller factories
- concrete interceptor implementation details
- concrete service classes unless they are intentionally exported in the package root in the future

## Stable `AsyncLibraryModule.forRoot(...)` Options

The following options are considered stable parts of the module contract:

- `queueName`
- `jobName`
- `defaultAllowedMethods`
- `exposeStatusController`
- `statusBasePath`
- `statusLocationBasePath`
- `statusTtlSeconds`
- `statusStoreClass`

Current expectations:

- `queueName` and `jobName` must be non-empty strings
- `defaultAllowedMethods` controls the default verb whitelist used by `@Async()`
- `exposeStatusController` controls whether the library registers its default status controller
- `statusBasePath` controls the default controller base path when that controller is enabled
- `statusLocationBasePath` controls the `location` returned in the accepted response when the host wants a custom public status route
- `statusTtlSeconds` configures retention for the default Redis-backed status store
- `statusStoreClass` lets the host replace the default status store implementation with its own injectable class implementing `IAsyncStatusStore`

The full option reference stays in [module-options.md](module-options.md).

## Stable Status Endpoint Contract

The library now treats the status endpoint behavior as stable at the contract level.

That includes:

- the accepted response shape
- the presence or absence of `location`
- the default polling route shape when the built-in controller is enabled
- the meaning of status polling responses

Stable expectations:

- when the library knows a public status route, it can return:

```json
{
  "status": "accepted",
  "location": "/<base>/status/<id>"
}
```

- when the library does not know a public status route, it returns:

```json
{
  "status": "accepted"
}
```

- the built-in controller route shape is:

```text
GET /<statusBasePath>/status/:id
```

- unknown job ids return:

```http
404 Not Found
```

- non-terminal polling states return `completed: false`
- terminal polling states return `completed: true`
- `waiting_external` means the initial BullMQ job started external work and the business process is waiting for a later webhook, event, or callback

The detailed route and controller rules stay in [status-endpoint.md](status-endpoint.md).

## Stable Status Store Contract

The library now treats the status store abstraction as stable at the contract level.

Stable pieces:

- token: `ASYNC_STATUS_STORE`
- interface: `IAsyncStatusStore`
- default semantics of:
  - `get`
  - `setAccepted`
  - `setActive`
  - `setWaitingExternal`
  - `setCompleted`
  - `setFailed`

Stable expectations:

- the host may replace the store through `statusStoreClass`
- the replacement store must implement `IAsyncStatusStore`
- the default implementation remains Redis-backed unless explicitly replaced

The detailed behavior and replacement guidance stay in [status-store.md](status-store.md).

## What Is Still Flexible

The library is still free to change internal implementation details that are not part of the documented contract, including:

- internal provider wiring
- internal class names and file layout
- internal BullMQ integration details behind the stable module options
- example app structure

## `0.1.0` Readiness

From a contract perspective, the project is close to `0.1.0` when:

- package-root exports remain intentional and stable
- `AsyncLibraryModule.forRoot(...)` option meanings stay stable
- status endpoint behavior remains consistent
- status store replacement remains compatible with `IAsyncStatusStore`

That does not mean no future changes; it means breaking changes should become deliberate exceptions rather than normal iteration.
