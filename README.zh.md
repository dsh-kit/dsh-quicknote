# dsh-quicknote

[![npm](https://img.shields.io/npm/v/dsh-quicknote)](https://www.npmjs.com/package/dsh-quicknote)
[![release](https://img.shields.io/github/v/release/dsh-kit/dsh-quicknote?label=release)](https://github.com/dsh-kit/dsh-quicknote/releases)

从输入框随手记下一条，不打断当前对话，之后在一页里找回。

- **从输入框**：点击工具栏的 **随手记**；卡片会带上当前草稿。可以只保存笔记，也可以显式选择“保存并清空输入框”。
- **从侧栏**：随手记页面支持搜索、全部/未完成/已完成或 `#标签` 筛选、复制、插入当前草稿，以及完成或删除（删除后可撤销）。
- **从 Agent**：`quicknote_add`、`quicknote_list`、`quicknote_done`、`quicknote_delete`。
- **存储**：`~/.dsh/quicknote/notes.json`，本地、权限 `0600`、原子写入，无遥测。

## 文档

<https://dsh-kit.github.io/dsh-quicknote/zh/>

## 安装

开发时链接到 CLI/web profile：

```bash
dsh plugin --profile web add link:$PWD
```

桌面端请使用应用内插件页；`desktop` profile 由应用管理。

发布后按包名安装到 CLI/web profile：

```bash
dsh plugin --profile web add dsh-quicknote
```

桌面端请使用应用内插件页；`desktop` profile 由应用管理。

## 验证

```bash
dsh --profile web --dump-config | grep -A2 "id: dsh-quicknote"
```

## 开发

```bash
pnpm install
pnpm verify   # 格式 → lint → 类型 → 测试 → 构建 → 打包
```

npm 也可用：`npm install && npm run verify`。

- `src/host/`：存储、五个 JSON 路由、四个 Agent 工具；
- `src/client/`：输入框按钮、记录卡片、侧栏页面；
- `lib/`：构建产物，提交进仓库（`link:` 安装不会构建）；
- `tests/`：存储与客户端注册测试；
- `AGENTS.md` / `llms.txt`：agent 上下文；
- `PUBLISHING.md`：发布清单。

## 数据与 API

- `GET /api/quicknote/notes`
- `POST /api/quicknote/notes/create` `{ text }`
- `POST /api/quicknote/notes/update` `{ id, done }`
- `POST /api/quicknote/notes/delete` `{ id }`（返回被删除的笔记）
- `POST /api/quicknote/notes/restore` `{ note }`

## 许可

MIT
