# 数据与 API

## 存储

`~/.dsh/quicknote/notes.json`（权限 `0600`，整文件原子写入）。

一条笔记：

```json
{ "id": "uuid", "text": "…", "done": false, "createdAt": 1760000000000 }
```

## 路由

| 方法 | 路径 | 请求体 |
| --- | --- | --- |
| GET | `/api/quicknote/notes` | — |
| POST | `/api/quicknote/notes/create` | `{ "text": "…" }` |
| POST | `/api/quicknote/notes/update` | `{ "id": "…", "done": true }` |
| POST | `/api/quicknote/notes/delete` | `{ "id": "…" }` |

## 工具

`quicknote_add`、`quicknote_list`、`quicknote_done`、`quicknote_delete`。
