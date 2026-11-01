# dsh-quicknote

Capture a note from the composer, keep it out of the way, and find it again on one page.

- **From the composer**: click **Note** in the composer toolbar. The card opens with the current draft; save it
  as a note, or save and explicitly clear the draft.
- **From the sidebar**: the Quick Note page lists everything newest-first, with done/reopen and delete.
- **From an agent**: `quicknote_add`, `quicknote_list`, `quicknote_done`, `quicknote_delete`.
- **Storage**: `~/.dsh/quicknote/notes.json` — local, mode `0600`, atomic writes. No telemetry.

## Documentation

<https://quicknote.dsh-kit.dev>

## Install

For development, link the working copy:

```bash
dsh plugin --profile <profile> add link:$PWD
```

A published release installs by package name:

```bash
dsh plugin --profile <profile> add dsh-quicknote
```

Desktop profiles are managed by the app: add `dsh-quicknote` to `dsh.profile.bundles` and the dependency, run
`pnpm install` in the profile, then restart DSH.

## Verify

```bash
dsh --profile <profile> --dump-config | grep -A2 "id: dsh-quicknote"
```

## Develop

```bash
pnpm install
pnpm verify   # format → lint → typecheck → tests → build → pack
```

npm works too: `npm install && npm run verify`.

- `src/host/` — store, four JSON routes and four Agent tools.
- `src/client/` — composer button, capture card, sidebar page.
- `lib/` — generated, committed (a `link:` install never builds).
- `tests/` — store and client registration.
- `AGENTS.md` / `llms.txt` — agent context.
- `PUBLISHING.md` — release checklist.

## Data and API

- `GET /api/quicknote/notes`
- `POST /api/quicknote/notes/create` `{ text }`
- `POST /api/quicknote/notes/update` `{ id, done }`
- `POST /api/quicknote/notes/delete` `{ id }`

## License

MIT
