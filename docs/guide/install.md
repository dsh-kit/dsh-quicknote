# Install

## The short version

1. Open a terminal.
2. Install into the profile used by the desktop app:

   ```bash
   dsh plugin --profile desktop add dsh-quicknote
   ```

3. Restart DSH.

You should then see **Quick Note** in the sidebar and **Note** in the composer toolbar.

`desktop` is the profile used by the desktop app. If you use another profile, replace it with that profile's name.

## Is this the dsh-kit plugin?

The maintained plugin is:

- npm: `dsh-quicknote`
- upstream: <https://github.com/dsh-kit/dsh-quicknote>
- composer button: **Note** (English) / **记一下** (Chinese)
- data: `~/.dsh/quicknote/notes.json`

A legacy local plugin at `wilsonwangdev/dsh-quicknote` may still be linked in your profile. It shows **随手记** in
the composer and stores data under `~/.dsh/capture`. Its upstream may be missing because that repository was
replaced.

Check what is installed:

```bash
cat ~/.dsh/profiles/desktop/node_modules/dsh-quicknote/package.json | grep -A2 repository
```

To switch from the legacy link to the maintained package:

```bash
dsh plugin --profile desktop remove dsh-quicknote
dsh plugin --profile desktop add dsh-quicknote
```

Restart DSH. The button changes from **随手记** to **记一下**.

Old notes are not moved automatically. The legacy store is `~/.dsh/capture`; the new store is
`~/.dsh/quicknote`. Copy or migrate the JSON only after backing it up.

## What `<profile>` means

A DSH **profile** is an isolated set of plugins and settings, stored under `~/.dsh/profiles/<name>`. The desktop app
uses the profile named `desktop`; the CLI and other apps may use `web`, `tui`, or a profile you created.

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

So this command must be run **inside the plugin source directory**:

```bash
cd /path/to/dsh-quicknote
dsh plugin --profile desktop add link:$PWD
```

If you are installing the published plugin, do **not** use `link:`. Use the package name:

```bash
dsh plugin --profile desktop add dsh-quicknote
```

On Windows PowerShell, use `link:.` or the full path instead of `$PWD`.

## Install from source

Only needed if you are changing the plugin:

```bash
pnpm install
pnpm verify
dsh plugin --profile desktop add link:$PWD
```

`pnpm install` installs the plugin's build dependencies. `pnpm verify` runs formatting, lint, type checking, tests,
the build and a pack check. A normal user installing from npm does not need either command.

## Verify

Open DSH and check:

- the sidebar has **Quick Note**;
- the composer toolbar has **Note**;
- saving a note and reopening DSH keeps it.

Advanced check:

```bash
dsh --profile desktop --dump-config | grep -A2 "id: dsh-quicknote"
```
