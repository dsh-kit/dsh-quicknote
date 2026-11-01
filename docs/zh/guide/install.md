# 安装

## 最短路径

### 桌面端

打开 DSH，进入插件页，安装 `dsh-quicknote`。`desktop` profile 由应用管理，不能用 `dsh plugin` 修改。

安装后重启 DSH。侧栏应出现 **随手记**，输入框工具栏应出现 **记一下**。

### CLI 或 web profile

```bash
dsh plugin --profile web add dsh-quicknote
```

换成你的 CLI 或 web 会话使用的 profile。`desktop` profile 不适用于这个命令。

## `<profile>` 是什么

DSH 的 **profile** 是一套独立的插件和设置，存放在 `~/.dsh/profiles/<名字>`。桌面端拥有名为 `desktop` 的
profile；CLI 或其他应用可能使用 `web`、`tui`，或者你自己创建的 profile。`dsh plugin` 只能操作 CLI 拥有的
profile。

查看本机已有的 profile：

```bash
ls ~/.dsh/profiles
```

插件会装进你指定的 profile。`dsh plugin` 的 `--profile` 是必填参数，不是让你原样输入 `<profile>`。

## `link:$PWD` 是什么

`link:$PWD` 只用于**本地开发**：

- `$PWD` 是 shell 当前目录；
- `link:` 表示链接本地目录，而不是从 npm 下载包。

在 CLI 或 web profile 中，它必须在插件源码目录里执行：

```bash
cd /path/to/dsh-quicknote
dsh plugin --profile web add link:$PWD
```

如果你安装的是已发布的插件，不要用 `link:`，直接用包名：

```bash
dsh plugin --profile web add dsh-quicknote
```

Windows PowerShell 中请用 `link:.` 或完整路径，不要用 `$PWD`。桌面端请使用应用内插件页；`desktop` profile
由应用管理。

## 从源码安装

只有你要改插件时才需要：

```bash
pnpm install
pnpm verify
dsh plugin --profile web add link:$PWD
```

`pnpm install` 安装插件的构建依赖；`pnpm verify` 跑格式、lint、类型检查、测试、构建和打包检查。
普通用户从 npm 安装时不需要这两条命令。

## 验证

打开 DSH，确认：

- 侧栏有 **随手记**；
- 输入框工具栏有 **记一下**；
- 保存一条笔记后重启 DSH，笔记仍在。

进阶检查：

```bash
dsh --profile web --dump-config | grep -A2 "id: dsh-quicknote"
```

桌面端请使用应用内插件页；`desktop` profile 不对 `dsh --dump-config` 开放。
