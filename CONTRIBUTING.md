# Contributing

## Branches

- `main` is the release branch.
- Work in feature/fix branches.
- Direct pushes to `main` should be prohibited by repository rules.

## Commits and PR titles

Use Conventional Commits.

Examples:

- `feat(record): add app field mapping`
- `fix(records): validate empty records array`
- `docs(readme): document lookup tokens`

PRs should be squash-merged.

## Required checks

Before opening a PR:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

## Pull requests

Describe:
- what changed
- affected resource/operation
- validation behavior
- tests performed
- whether the change is breaking

Never include API tokens, credentials, customer data, or production record payloads.

## Versions

Semantic Versioning:
- initial development: 0.x
- stable public contract: 1.0.0
