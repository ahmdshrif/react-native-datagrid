# Releasing

## Beta

1. `npm login` (once per machine).
2. Make sure `main` is green in CI and your working tree is clean.
3. Bump the version in `package.json` if needed, for example `0.1.0-beta.1`, and add a `CHANGELOG.md` entry.
4. `yarn prepare` — builds `lib/` with bob.
5. `npm publish` — `publishConfig.tag` is `beta`, so it will **not** become `latest`.
6. `git tag v0.1.0-beta.0 && git push --tags`.

Install instructions for testers: `npm install react-native-datagrid@beta`.

## Stable

Same steps, with `npm publish --tag latest`, after the beta has been confirmed on physical devices.

## Checklist before publishing

- `yarn lint`, `yarn typecheck`, `yarn test` pass.
- `npm pack --dry-run` lists only `src/`, `lib/`, `README.md`, `LICENSE` and `package.json`.
- The example app builds and runs in Release on both platforms.
- A clean install into a fresh app renders the grid (see `docs/spike-results.md` for the method).
