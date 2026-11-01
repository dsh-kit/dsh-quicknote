# Data and API

## Storage

`~/.dsh/quicknote/notes.json` (mode `0600`, atomic whole-file writes).

A note is:

```json
{ "id": "uuid", "text": "…", "done": false, "createdAt": 1760000000000 }
```

## Routes

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/quicknote/notes` | — |
| POST | `/api/quicknote/notes/create` | `{ "text": "…" }` |
| POST | `/api/quicknote/notes/update` | `{ "id": "…", "done": true }` |
| POST | `/api/quicknote/notes/delete` | `{ "id": "…" }` |

## Tools

`quicknote_add`, `quicknote_list`, `quicknote_done`, `quicknote_delete`.
