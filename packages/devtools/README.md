# react-access-engine-devtools

Development-only debugging overlay for [react-access-engine](https://www.npmjs.com/package/react-access-engine). Visualize RBAC, ABAC, feature flags, A/B experiments, policies, and access decisions in real time. Zero-config debug panel for React and Next.js.

[Documentation](https://react-access-engine.dev/docs) · [Playground](https://react-access-engine.dev/playground) · [GitHub](https://github.com/abhishekayu/react-access-engine)

## Installation

```bash
pnpm add -D react-access-engine-devtools
```

## Quick Start

```tsx
import { AccessProvider, defineAccess } from 'react-access-engine';
import { AccessDevtools } from 'react-access-engine-devtools';

const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,
  permissions: {
    admin: ['*'] as const,
    editor: ['articles:read', 'articles:write'] as const,
    viewer: ['articles:read'] as const,
  },
  features: {
    'dark-mode': { enabled: true },
    'new-editor': { rolloutPercentage: 50 },
  },
  debug: true, // Required for event recording
});

function App() {
  return (
    <AccessProvider config={config} user={user}>
      <YourApp />
      {/* Only renders in development — zero cost in production */}
      <AccessDevtools />
    </AccessProvider>
  );
}
```

## Features

### Live Dashboard

The devtools overlay shows:

| Tab             | What it shows                                                  |
| --------------- | -------------------------------------------------------------- |
| **Overview**    | User ID, roles, permissions, plan, feature/experiment counts   |
| **Access**      | Permission checks with granted/denied status and reasons       |
| **Features**    | All feature flags with enabled/disabled state and reason codes |
| **Policies**    | Policy evaluations with matched rules and effect               |
| **Experiments** | Active experiments with assigned variants                      |
| **Event Log**   | Combined chronological log of all events                       |

### Keyboard Shortcut

Toggle the panel with **Ctrl+Shift+A** (or **Cmd+Shift+A** on Mac).

```tsx
// Disable the shortcut
<AccessDevtools disableShortcut />
```

### Positioning

```tsx
<AccessDevtools position="bottom-left" />
<AccessDevtools position="top-right" />
<AccessDevtools position="top-left" />
<AccessDevtools position="bottom-right" /> {/* default */}
```

### Filtering

Every tab (except Overview) has a filter bar. Type to search by permission name, feature name, or reason code. The Event Log tab also has type filters (All / Access / Feature / Policy).

### Component Labels

Use `DebugLabel` to tag sections of your component tree. This makes devtools log entries easier to trace back to specific UI areas:

```tsx
import { DebugLabel } from 'react-access-engine-devtools';

function Sidebar() {
  return (
    <DebugLabel name="Sidebar">
      <Can perform="settings:view">
        <SettingsLink />
      </Can>
      <Can perform="admin:access">
        <AdminLink />
      </Can>
    </DebugLabel>
  );
}
```

### Programmatic Control

```tsx
import { enableDebug, disableDebug, isDebugEnabled } from 'react-access-engine-devtools';

// Toggle debug collection at runtime
disableDebug(); // pause collection
enableDebug(); // resume collection
isDebugEnabled(); // check status
```

## Props

| Prop              | Type                                                           | Default          | Description                           |
| ----------------- | -------------------------------------------------------------- | ---------------- | ------------------------------------- |
| `position`        | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Panel position                        |
| `defaultOpen`     | `boolean`                                                      | `false`          | Start with panel open                 |
| `shortcut`        | `string`                                                       | —                | Reserved for custom shortcut (future) |
| `disableShortcut` | `boolean`                                                      | `false`          | Disable keyboard toggle               |

## How It Works

1. The core `react-access-engine` package has a `DebugEngine` that records access checks, feature evaluations, and policy evaluations when `debug: true` is set.

2. The devtools package subscribes to the `DebugEngine`'s event stream via `subscribe()` — a push-based listener API that delivers events in real time.

3. Events are converted into structured `DevtoolsLogEntry` objects and rendered in the overlay UI.

4. The overlay reads `AccessContext` directly (exported from the core package) to show the current user state, computed permissions, feature results, and experiment assignments.

5. In production, `AccessDevtools` renders `null` — it's completely tree-shaken.

## License

[MIT](https://github.com/abhishekayu/react-access-engine/blob/main/LICENSE) © [Abhishek Verma](https://github.com/abhishekayu)

## Architecture

```
┌──────────────────────────────────────────────┐
│  Your App                                    │
│  ┌────────────────────────────────────────┐  │
│  │ <AccessProvider config={...} user={…}> │  │
│  │    ┌──────────────┐                    │  │
│  │    │  DebugEngine │◄─── records events │  │
│  │    │  PluginEngine│                    │  │
│  │    └──────┬───────┘                    │  │
│  │           │ subscribe()                │  │
│  │    ┌──────▼───────────────────┐        │  │
│  │    │  <AccessDevtools />      │        │  │
│  │    │  ├─ useDevtoolsContext() │        │  │
│  │    │  ├─ useDebugLog()        │        │  │
│  │    │  ├─ useDevtoolsSnapshot()│        │  │
│  │    │  └─ Panel UI             │        │  │
│  │    └──────────────────────────┘        │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Development

```bash
pnpm --filter react-access-engine-devtools build
pnpm --filter react-access-engine-devtools typecheck
```
