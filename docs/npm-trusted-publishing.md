# npm Trusted Publishing setup

The publication workflow uses GitHub OIDC and does not use an `NPM_TOKEN`. Before the next release, a maintainer must configure these external controls:

1. Create the GitHub environment `npm-production` and require approval from a maintainer before deployment.
2. In the npm package settings for `nestjs-async-request-reply`, add a GitHub Actions trusted publisher with exactly:
   - organization or user: `gustavoarielms`
   - repository: `asynchronous-request-reply-pattern-nestjs-example`
   - workflow filename: `publish-package.yml`
   - environment: `npm-production`

Repository tests cannot verify those settings. Confirm both controls in GitHub and npm before publishing a release; do not add a long-lived npm token as a fallback.

## Release trigger constraint

The publish workflow intentionally accepts only the GitHub `release: published` event. [GitHub does not start a new workflow for most events created with a workflow's default `GITHUB_TOKEN`](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs), and `release-please.yml` currently uses that default token. Therefore, a Release created by the current release-please run may not start the publish workflow.

This is separate from the npm environment and Trusted Publishing configuration above. Before the next release, a maintainer must ensure the Release is published by an actor whose event can start workflows, or separately approve a GitHub App/PAT-based release automation design. This repository change does not add either credential or an alternate trigger.
