# 安装

## 要求

- DeepSeek Harness 0.2.1-rc.5 或更新
- Node 24+

## 从 npm 包安装

```bash
dsh plugin --profile <profile> add dsh-quicknote
```

## 从本地工作副本安装

```bash
pnpm install
pnpm verify
dsh plugin --profile <profile> add link:$PWD
```

桌面 profile 由应用托管：把 `dsh-quicknote` 加进 `dsh.profile.bundles` 与依赖，在 profile 里执行
`pnpm install`，重启 DSH。

## 验证

```bash
dsh --profile <profile> --dump-config | grep -A2 "id: dsh-quicknote"
```

打开 DSH，侧栏应出现 **随手记**，输入框工具栏应出现 **记一下**。
