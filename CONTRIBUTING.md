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

`main` is protected by `verify (24)`, `verify (26)` and `gitleaks`, with linear history and squash merge only; no
approving review is required. Each pull request lands as a single commit, so **open one pull request per concern** —
separate pull requests are what keep a change independently revertable. A branch may hold several commits while it is
under review; they are squashed on merge.

## Release

See [PUBLISHING.md](PUBLISHING.md).
