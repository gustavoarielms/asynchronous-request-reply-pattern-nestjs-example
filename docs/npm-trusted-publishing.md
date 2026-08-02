# npm Trusted Publishing setup

The publication workflow uses GitHub OIDC and does not use an `NPM_TOKEN`. Before the next release, a maintainer must configure these external controls:

1. Create the GitHub environment `npm-production` and require approval from a maintainer before deployment.
2. In the npm package settings for `nestjs-async-request-reply`, add a GitHub Actions trusted publisher with exactly:
   - organization or user: `gustavoarielms`
   - repository: `asynchronous-request-reply-pattern-nestjs-example`
   - workflow filename: `publish-package.yml`
   - environment: `npm-production`

Repository tests cannot verify those settings. Confirm both controls in GitHub and npm before publishing a release; do not add a long-lived npm token as a fallback.

## Release flow

1. Merge the release PR prepared by release-please.
2. `release-please.yml` creates the version tag and a draft GitHub Release. The `force-tag-creation` setting ensures the tag exists while the Release is still a draft.
3. A maintainer reviews and manually publishes that existing draft Release.
4. The resulting `release: published` event starts `publish-package.yml`.
5. The workflow verifies that the release tag has the expected `nestjs-async-request-reply-vX.Y.Z` format, matches `package.json`, resolves to the checked-out commit, and belongs to `main`.
6. A maintainer approves the `npm-production` environment deployment.
7. The workflow uses GitHub OIDC to publish the verified package to npm with provenance.

The publish workflow intentionally accepts only the GitHub `release: published` event. [GitHub does not start a new workflow for most events created with a workflow's default `GITHUB_TOKEN`](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs), so release-please leaves the Release as a draft for a maintainer to publish. Do not add a PAT, GitHub App credential, `NPM_TOKEN`, `workflow_dispatch`, or another publication trigger as a workaround.
