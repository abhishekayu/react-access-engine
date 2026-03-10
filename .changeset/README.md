# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## Adding a changeset

When you make a change that should be released, run:

```bash
pnpm changeset
```

This will prompt you to select which packages have changed and the type of change (major, minor, patch).

## Releasing

Releases are automated via the [Release workflow](.github/workflows/release.yml). When changesets are merged to `main`, a "Version Packages" PR is automatically created. Merging that PR publishes to npm.
