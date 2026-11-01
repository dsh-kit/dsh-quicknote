# Contributing

## Before a pull request

```bash
pnpm install
pnpm verify
```

`pnpm verify` runs formatting, lint, type checking, both test suites, the build, the manifest check and
`npm pack --dry-run`.

## Rules

- The store writes one JSON file atomically with mode `0600`; do not weaken that.
- Saving a note must never silently clear the composer draft. Clearing is a separate, labelled action.
- Keep the host routes and the four Agent tools on the same store; add tests for both.
- `lib/` is generated and committed; never edit it by hand.
- UI copy ships in English and Chinese, in the same change.

## Review

`main` is protected: one approval, `verify (24)`, `verify (26)` and `gitleaks`. Squash merge only.

## Release

See [PUBLISHING.md](PUBLISHING.md).
