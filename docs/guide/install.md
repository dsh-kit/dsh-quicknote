# Install

## Requirements

- DeepSeek Harness 0.2.1-rc.5 or newer
- Node 24+

## From the npm package

```bash
dsh plugin --profile <profile> add dsh-quicknote
```

## From a local working copy

```bash
pnpm install
pnpm verify
dsh plugin --profile <profile> add link:$PWD
```

Desktop profiles are app-managed: add `dsh-quicknote` to `dsh.profile.bundles` and the dependency, run
`pnpm install` in the profile, then restart DSH.

## Verify

```bash
dsh --profile <profile> --dump-config | grep -A2 "id: dsh-quicknote"
```

Open DSH and look for **Quick Note** in the sidebar, or **Note** in the composer toolbar.
