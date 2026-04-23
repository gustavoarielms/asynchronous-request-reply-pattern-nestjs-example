# Release Hygiene

This document defines the release hygiene expected now that the package is published to npm.

The goal is simple:

- every release should say what changed
- every release should make breaking changes explicit
- every release should say whether migration is required

## Release Checklist

Before merging a release PR, verify:

1. the release version makes sense for the change scope
2. the generated changelog entry is understandable to a consumer
3. breaking changes are called out explicitly
4. migration steps are documented when needed
5. the package was validated at the right level for the change

## What Every Release Should Communicate

At minimum, every release should leave these answers clear:

- what changed?
- is there any breaking change?
- does a consumer need to migrate anything?

If the answer to breaking changes or migration is "no", that should still be easy to infer from the release notes.

## Changelog Expectations

The generated [CHANGELOG.md](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/CHANGELOG.md) is the baseline release history, but it is not enough by itself if a release needs interpretation.

For routine releases, the generated entry is acceptable when it is already clear and low-risk.

For more important releases, check that the changelog entry makes the following clear:

- the main user-facing change
- whether the change affects package consumers or only internal repo maintenance
- whether there is a behavior change that is technically compatible but operationally important

## Breaking Changes

If a release contains a breaking change, do not rely on consumers to infer it from commit messages.

Call it out explicitly in at least one of these places:

- the release PR description
- the GitHub Release notes
- a dedicated migration note in the changelog or linked docs

Breaking changes usually include:

- removing or renaming public exports
- changing meanings of stable `AsyncLibraryModule.forRoot(...)` options
- changing the status endpoint contract in a way that breaks existing consumers
- changing the `IAsyncStatusStore` contract incompatibly

## Migration Guidance

If consumers need to change code or configuration after upgrading, document that as migration guidance.

Keep it concrete:

- old behavior
- new behavior
- what a consumer must change

Good migration guidance is short and executable. Avoid vague notes like "update your config" without saying exactly how.

## Suggested Release Notes Structure

For releases that need more than the generated changelog, use this structure:

### What changed

- short list of the important consumer-facing changes

### Breaking changes

- explicit list, or `None`

### Migration

- explicit steps, or `No migration required`

## Validation Expectations By Change Type

The release notes should match the validation depth of the change.

Examples:

- docs-only change:
  - no runtime validation required
- package metadata or publishing change:
  - `npm run build:package`
  - `npm pack --dry-run`
- runtime library change:
  - unit/e2e coverage as appropriate
  - example or consumer validation when the public contract changed
- distribution-path change:
  - external consumer validation is preferred

## Relationship To Stability Contract

Use [stability-contract.md](/Users/gustavo/Patxa/asynchronous-request-reply-pattern-nestjs-example/docs/stability-contract.md) as the reference for what should be treated as stable.

If a release changes something declared stable there, assume it requires:

- explicit release notes
- explicit breaking-change evaluation
- migration guidance if consumers must adapt
