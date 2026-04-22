# Contributing

## Branch strategy

- `main` is the stable integration branch.
- All regular changes must land in `main` through pull requests.
- Do not commit directly to `main`.
- Release automation (`release-please`) runs from `main`, opens the release PR, and publishes from the generated release flow.
- Keep `main` linear for release automation. Prefer `Squash and merge` and disable plain merge commits in GitHub repository settings.

## Branch naming

Use short, descriptive branch names with this format:

```text
<type>/<short-description>
```

Recommended branch types:

- `feature/` for new capabilities
- `fix/` for bug fixes
- `refactor/` for internal code changes without behavior changes
- `docs/` for documentation-only changes
- `test/` for test-only changes
- `chore/` for maintenance or tooling changes
- `hotfix/` for urgent production fixes

Examples:

```text
feature/expose-status-controller
fix/status-location-header
docs/add-branching-guidelines
refactor/extract-async-library-core
chore/update-release-workflow
```

Guidelines:

- Use lowercase letters.
- Separate words with hyphens.
- Keep the name focused on one change.
- Do not add author or tool prefixes such as `codex/` unless the repository explicitly adopts that convention.
- Avoid generic names such as `test`, `changes`, or `new-branch`.

## Pull request target

- Open feature, fix, docs, refactor, test, and chore PRs against `main`.
- Do not open manual release PRs unless the repository maintainers explicitly decide to bypass `release-please`.

## Pull request title

Prefer a concise Conventional Commits style title because it works well with the current release automation:

```text
type(scope): short summary
```

Examples:

```text
feat(async): expose optional status controller
fix(example): return explicit polling location
docs(readme): document branch and PR workflow
refactor(lib): extract async module contracts
test(async): cover accepted status persistence
chore(ci): align node version in workflows
```

If no scope is useful, omit it:

```text
docs: clarify contribution flow
```

Guidelines:

- The title must describe the actual change in the PR.
- Do not use tool or author prefixes such as `[codex]`.
- Keep it specific enough that someone can understand the change from the PR list alone.
- Classify the title by consumer-facing impact, not by implementation technique.
- Use `feat:` when the package gains new public capability or broadens a public contract.
- Use `fix:` when the package corrects observable behavior.
- Use `feat!:` or `fix!:` when the change is breaking for consumers, including removed exports or incompatible configuration changes.
- Avoid `refactor:` for consumer-visible API, configuration, or behavior changes because `release-please` will not create a release from that type alone.

Examples of refactor-shaped changes that should not be titled `refactor:`:

```text
feat: allow JSON-like async status results
fix: validate async module options eagerly
feat!: narrow public package exports
```

## Pull request checklist

Each PR should:

- describe the change clearly in the summary
- list the concrete changes included
- explain why the change is needed
- mark the affected scope
- describe how the change was validated
- include notes when there are tradeoffs, follow-ups, or limitations

This repository already provides a PR template in `.github/pull_request_template.md`. Use it for every PR.

## Suggested workflow

1. Create a branch from `main`.
2. Implement one focused change.
3. Run the relevant validation locally.
4. Open a PR to `main`.
5. Wait for review and CI before merge.
6. Merge to `main` with `Squash and merge`, keeping the PR title as the squash commit message.
7. Let `release-please` manage release PRs and version publishing.

## Optional repository enforcement

To reinforce this process in GitHub settings, maintainers can also:

- protect `main` and block direct pushes
- require at least one approving review
- require status checks before merge
- require branch to be up to date before merge
- require the PR template to be completed during review
- enable `Squash and merge`
- disable `Merge commit`
- default to PR title for squash merge commits
