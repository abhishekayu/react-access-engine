# Publishing Guide

How to publish updated versions of `react-access-engine` and `react-access-engine-devtools` to npm.

## Prerequisites

- Logged into npm: `npm login`
- All tests passing: `pnpm test`

## Steps

### 1. Make your changes

Edit source code in `packages/react-access-engine/src/` or `packages/devtools/src/`.

### 2. Bump the version

```bash
# For the core package
cd packages/react-access-engine
npm version patch   # 0.1.0 → 0.1.1 (bug fix)
npm version minor   # 0.1.0 → 0.2.0 (new feature)
npm version major   # 0.1.0 → 1.0.0 (breaking change)

# For devtools
cd packages/devtools
npm version patch
```

### 3. Build

```bash
# Build all packages
pnpm run build

# Or build individually
cd packages/react-access-engine && pnpm build
cd packages/devtools && pnpm build
```

### 4. Run tests

```bash
pnpm test
```

### 5. Publish

```bash
# Core package
cd packages/react-access-engine
npm publish --access public --otp=YOUR_OTP_CODE

# Devtools package
cd packages/devtools
npm publish --access public --otp=YOUR_OTP_CODE
```

Replace `YOUR_OTP_CODE` with the 6-digit code from your authenticator app.

### 6. Push version tag

```bash
git add .
git commit -m "chore: release v0.1.1"
git tag v0.1.1
git push && git push --tags
```

## Version Cheat Sheet

| Change type     | Command                               | Example              |
| --------------- | ------------------------------------- | -------------------- |
| Bug fix         | `npm version patch`                   | 0.1.0 → 0.1.1        |
| New feature     | `npm version minor`                   | 0.1.0 → 0.2.0        |
| Breaking change | `npm version major`                   | 0.1.0 → 1.0.0        |
| Pre-release     | `npm version prerelease --preid=beta` | 0.2.0 → 0.2.1-beta.0 |

## Quick One-Liner

```bash
# Patch release for core package
cd packages/react-access-engine && npm version patch && pnpm build && npm publish --access public --otp=YOUR_OTP

# Patch release for devtools
cd packages/devtools && npm version patch && pnpm build && npm publish --access public --otp=YOUR_OTP
```

## Package Names

| Package  | npm name                       |
| -------- | ------------------------------ |
| Core     | `react-access-engine`          |
| DevTools | `react-access-engine-devtools` |
