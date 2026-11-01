# Publishing

1. Run `pnpm verify` and make sure it is green.
2. Bump `version` and add the matching `CHANGELOG.md` entry.
3. Inspect the artifact: `npm pack --dry-run`.
4. Publish with provenance: `npm publish --provenance`.
5. Tag the release: `git tag v<version>` and push the tag.
6. Install the published package into a fresh profile and check the client bundle is served.

For local development, `dsh plugin --profile <profile> add link:$PWD` installs the working copy instead of a
published version.
