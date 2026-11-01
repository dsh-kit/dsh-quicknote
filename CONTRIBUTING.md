# Contributing

Thanks for helping. dsh-quicknote exists so DSH plugins do not have to rebuild the same maintenance layer.

## Before you start

- Read [ROADMAP.md](ROADMAP.md). Pick a milestone or open a **Roadmap task** issue.
- Read [AGENTS.md](packages/create-dsh-quicknote/template/AGENTS.md) if you are changing the template.
- English is the primary language; every document has a Chinese mirror. Both are reviewed.

## Before a pull request

Pick the smallest check that covers your change:

```bash
pnpm install
pnpm check            # tests, preflight, docs and SSOT checks, seconds
pnpm verify:template  # generate → install → verify, one command (template/generator changes)
pnpm docs:build       # docs-only changes
```

`pnpm verify:template` creates a temp project, installs it with pnpm, runs the generated `pnpm verify`, and
removes it. Add `--keep` to inspect the project afterwards.

The generator must always produce a project that passes `pnpm verify` on a clean checkout. If you change the
template, change its tests in the same pull request.

## Change rules

- A failing test or a reproduction comes before the fix.
- No new runtime dependencies in the template.
- No undocumented DSH APIs.
- `lib/` is generated and committed; never edit it by hand.
- Docs changes ship both languages, or a note that the mirror is pending.

## Site

```bash
pnpm install
pnpm docs:dev    # http://127.0.0.1:4173
```

## Secret scan

```bash
git config core.hooksPath .githooks   # one-time, per clone
```

The hook runs gitleaks on staged changes; CI scans the full history.

## Code of conduct

Be direct, assume good faith, and keep discussion about the work. Harassment or personal attacks are not
welcome; maintainers may close threads that ignore this.

## Single source of truth

`package.json` owns the version, Node engine and pnpm version; the template mirrors the Node engine. The docs
are checked against those facts by `scripts/check-consistency.mjs`, and copyable commands by
`scripts/check-docs.mjs`. Change the source first, then the docs; `pnpm check` fails on drift.

## Release

See [PUBLISHING.md](PUBLISHING.md): GitHub owns review and history, npm owns the artifact, and CI publishes
with provenance.

## Review and merge policy

- `main` is protected: changes arrive through a pull request, not a direct push.
- One maintainer approval and green `verify` / `gitleaks` checks are required.
- Squash merge only; the PR title becomes the commit subject. Linear history, no merge commits.
- Delete the branch after merge; keep `main` releasable at all times.
- A release is a tag on `main`; the tag must match the package version.

## Identity and licensing

- The project is licensed to `dsh-quicknote contributors`; do not paste another project's copyright line.
- Commit with a GitHub identity you are comfortable publishing.
- `pnpm preflight` fails on absolute user paths, private keys and identity leaks.

## Site

The documentation site lives in `docs/` and is built with VitePress. `pnpm docs:dev` serves it locally; the
Pages workflow builds `docs/.vitepress/dist`. Add an English page first and a `zh/` mirror in the same change.
