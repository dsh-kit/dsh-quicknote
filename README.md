# dsh-quicknote

[![npm](https://img.shields.io/npm/v/dsh-quicknote)](https://www.npmjs.com/package/dsh-quicknote)
[![release](https://img.shields.io/github/v/release/dsh-kit/dsh-quicknote?label=release)](https://github.com/dsh-kit/dsh-quicknote/releases)

Capture a note from the composer, keep it out of the way, and find it again on one page.

- **From the composer**: click **Quick Note** in the composer toolbar. The card opens with the current draft; save it
  as a note, or save and explicitly clear the draft.
- **From the sidebar**: search, filter All/Open/Done or by `#tag`, copy, insert into the active draft, and mark done or
  delete with an undo toast.
- **From an agent**: `quicknote_add`, `quicknote_list`, `quicknote_done`, `quicknote_delete`.
- **Storage**: `~/.dsh/quicknote/notes.json` — local, mode `0600`, atomic writes. No telemetry.

## Documentation

<https://dsh-kit.github.io/dsh-quicknote/>

## Install

For development, link the working copy into a CLI/web profile:

```bash
dsh plugin --profile web add link:$PWD
```

For the desktop app, use the in-app plugin page; the `desktop` profile is app-managed.

A published release installs by package name into a CLI/web profile:

```bash
dsh plugin --profile web add dsh-quicknote
```

For the desktop app, use its plugin page; the `desktop` profile is app-managed.

## Verify

```bash
dsh --profile web --dump-config | grep -A2 "id: dsh-quicknote"
```

## Develop

```bash
pnpm install
pnpm verify   # format → lint → typecheck → tests → build → pack
```

npm works too: `npm install && npm run verify`.

- `src/host/` — store, five JSON routes and four Agent tools.
- `src/client/` — composer button, capture card, sidebar page.
- `lib/` — generated, committed (a `link:` install never builds).
- `tests/` — store and client registration.
- `AGENTS.md` / `llms.txt` — agent context.
- `PUBLISHING.md` — release checklist.

## Data and API

- `GET /api/quicknote/notes`
- `POST /api/quicknote/notes/create` `{ text }`
- `POST /api/quicknote/notes/update` `{ id, done }`
- `POST /api/quicknote/notes/delete` `{ id }` (returns the removed note)
- `POST /api/quicknote/notes/restore` `{ note }`

## License

MIT
