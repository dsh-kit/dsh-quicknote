# 开发

```bash
pnpm install
pnpm verify
```

`pnpm verify` 会跑格式、lint、类型检查、两套测试、构建、清单检查和 `npm pack --dry-run`。

在 DSH 里测试工作副本：

```bash
pnpm build
dsh plugin --profile <profile> add link:$PWD
```

然后重启 DSH。客户端产物由 `tsdown.config.ts` 生成，不要手改 `lib/`。
