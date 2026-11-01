# Install

## The short version

### Desktop app

Open DSH, go to the plugin page, and install `dsh-quicknote`. The desktop profile is managed by the application;
`dsh plugin` cannot modify it.

Restart DSH after installation. You should see **Quick Note** in the sidebar and **Quick Note** in the composer toolbar.

### CLI or web profile

```bash
dsh plugin --profile web add dsh-quicknote
```

Use the profile that backs your CLI or web session. The `desktop` profile is not available to this command.

## What `<profile>` means

A DSH **profile** is an isolated set of plugins and settings, stored under `~/.dsh/profiles/<name>`. The desktop app
owns the profile named `desktop`; the CLI and other apps may use `web`, `tui`, or a profile you created. Only use
`dsh plugin` with a profile the CLI owns.

To see the profiles on your machine:

```bash
ls ~/.dsh/profiles
```

Use the same profile where you want the plugin to appear. The `--profile` flag is required by `dsh plugin`; it is
not a placeholder you should type literally.

## What `link:$PWD` means

`link:$PWD` is only for **local development**:

- `$PWD` is the shell's current directory;
- `link:` tells DSH to link that directory instead of downloading a package from npm.

For a CLI or web profile, run this inside the plugin source directory:

```bash
cd /path/to/dsh-quicknote
dsh plugin --profile web add link:$PWD
```

If you are installing the published plugin, do **not** use `link:`. Use the package name:

```bash
dsh plugin --profile web add dsh-quicknote
```

On Windows PowerShell, use `link:.` or the full path instead of `$PWD`. For the desktop app, use its plugin page;
the `desktop` profile is app-managed.

## Install from source

Only needed if you are changing the plugin:

```bash
pnpm install
pnpm verify
dsh plugin --profile web add link:$PWD
```

`pnpm install` installs the plugin's build dependencies. `pnpm verify` runs formatting, lint, type checking, tests,
the build and a pack check. A normal user installing from npm does not need either command.

## Verify

Open DSH and check:

- the sidebar has **Quick Note**;
- the composer toolbar has **Quick Note**;
- saving a note and reopening DSH keeps it.

Advanced check:

```bash
dsh --profile web --dump-config | grep -A2 "id: dsh-quicknote"
```

For the desktop app, use its plugin page; the `desktop` profile is not exposed to `dsh --dump-config`.
