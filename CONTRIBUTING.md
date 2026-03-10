# Contributing to react-access-control

Thank you for considering a contribution! Every improvement — fixing a typo, adding a test, filing an issue, or writing a feature — makes this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Project Structure](#project-structure)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9 (the repo uses `packageManager` field — `corepack enable` will install it automatically)
- [Git](https://git-scm.com/)

### Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/react-access-engine.git
cd react-access-engine

# 3. Install dependencies
pnpm install

# 4. Build all packages
pnpm build

# 5. Run tests to confirm everything works
pnpm test
```

## Development Workflow

### Common Commands

| Command                                         | Description                      |
| ----------------------------------------------- | -------------------------------- |
| `pnpm build`                                    | Build all packages               |
| `pnpm test`                                     | Run all tests                    |
| `pnpm lint`                                     | Lint all packages                |
| `pnpm typecheck`                                | Type-check all packages          |
| `pnpm format`                                   | Format all files with Prettier   |
| `pnpm format:check`                             | Check formatting without writing |
| `pnpm --filter react-access-control test:watch` | Watch tests for the core package |
| `pnpm --filter playground dev`                  | Start the Vite playground        |
| `pnpm --filter docs dev`                        | Start the docs dev server        |

### Working on a Package

```bash
# Watch mode for the core package
pnpm --filter react-access-control dev

# In another terminal, run tests in watch mode
pnpm --filter react-access-control test:watch
```

### Adding a Changeset

Before submitting a PR that changes published packages, create a changeset:

```bash
pnpm changeset
```

This will prompt you to:

1. Select the packages you changed
2. Choose the semver bump type (patch / minor / major)
3. Write a summary of the change

The changeset file will be committed with your PR and consumed during the release process.

**When to create a changeset:**

- Bug fixes → `patch`
- New features (backward-compatible) → `minor`
- Breaking changes → `major`

**When NOT to create a changeset:**

- Changes to docs, examples, CI, or tooling only
- Changes to `private: true` packages (like `shared`)

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commits are validated by [commitlint](https://commitlint.js.org/) via a Git hook.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Use for                                   |
| ---------- | ----------------------------------------- |
| `feat`     | New feature                               |
| `fix`      | Bug fix                                   |
| `docs`     | Documentation only                        |
| `style`    | Code style (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes nor adds   |
| `perf`     | Performance improvement                   |
| `test`     | Adding or updating tests                  |
| `build`    | Build system or dependencies              |
| `ci`       | CI/CD configuration                       |
| `chore`    | Maintenance tasks                         |
| `revert`   | Revert a previous commit                  |

### Examples

```bash
feat(core): add environment-scoped feature flags
fix(policy-engine): handle undefined resource in condition evaluation
docs: add ABAC policy examples to README
test(experiments): add edge case for zero allocation
refactor(hooks): extract shared permission check logic
ci: add Node 22 to test matrix
chore: update dev dependencies
```

## Pull Request Process

1. **Branch from `main`** — create a descriptive branch: `feat/remote-config-polling`, `fix/wildcard-permission-matching`
2. **Keep PRs focused** — one logical change per PR
3. **Write tests** — all new features and bug fixes should include tests
4. **Update docs** — if your change affects the public API, update the relevant documentation
5. **Add a changeset** — run `pnpm changeset` for changes to published packages
6. **Ensure CI passes** — lint, typecheck, test, and build must all pass
7. **Fill out the PR template** — describe what changed and why

### PR Checklist

- [ ] Tests added or updated
- [ ] Changeset added (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes

### Review Process

- A maintainer will review your PR within a few days
- Feedback is about code quality, not you personally
- Small, focused PRs are reviewed faster
- Once approved, a maintainer will merge using squash merge

## Reporting Bugs

Use the [bug report template](https://github.com/abhishekayu/react-access-engine/issues/new?template=bug_report.yml) and include:

1. **What you expected** vs. **what happened**
2. **Steps to reproduce** (code snippet or minimal repo)
3. **Environment** — React version, Node version, bundler, SSR or client-only
4. **Relevant error messages** or stack traces

## Suggesting Features

Use the [feature request template](https://github.com/abhishekayu/react-access-engine/issues/new?template=feature_request.yml) and include:

1. **Problem** — what are you trying to do?
2. **Proposed solution** — your ideal API
3. **Alternatives considered** — other approaches you've thought of

## Project Structure

```
packages/
├── react-access-control/  # Core library (npm: react-access-control)
│   ├── src/
│   │   ├── components/    # React components (Can, Feature, AccessGate, etc.)
│   │   ├── hooks/         # React hooks (usePermission, useFeature, etc.)
│   │   ├── engines/       # Pure logic engines (permission, feature, policy, etc.)
│   │   ├── types/         # TypeScript type definitions
│   │   ├── plugins/       # Built-in plugins
│   │   └── utils/         # Internal utilities
│   └── tests/             # Vitest tests
├── devtools/              # @react-access-control/devtools
└── shared/                # Internal shared utilities (private)
```

### Key Architectural Decisions

- **Engines are pure functions** — no React dependencies, easily testable
- **Hooks compose engines** — each hook calls one or more engines
- **Components are thin wrappers** — they call hooks and conditionally render
- **Everything is tree-shakeable** — unused engines are eliminated at build time
- **SSR-safe by design** — deterministic evaluation, no side effects

## Getting Help

- **Questions** → [GitHub Discussions](https://github.com/abhishekayu/react-access-engine/discussions)
- **Bugs** → [Issue Tracker](https://github.com/abhishekayu/react-access-engine/issues)
- **Security** → See [SECURITY.md](SECURITY.md)

Thank you for contributing! 🎉
