import React, { useState, useMemo } from 'react';
import {
  defineAccess,
  AccessProvider,
  Can,
  Feature,
  AccessGate,
  PermissionGuard,
  Experiment,
  useAccess,
  useRole,
  useFeature,
  usePermission,
  usePlan,
  usePolicy,
  useExperiment,
  useAccessDebug,
  createAuditLoggerPlugin,
} from 'react-access-engine';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  app: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: 1100,
    margin: '0 auto',
    padding: 24,
    color: '#1a1a1a',
  } as React.CSSProperties,
  header: {
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: 16,
    marginBottom: 24,
  } as React.CSSProperties,
  controlBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    marginBottom: 24,
  } as React.CSSProperties,
  controlGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#666',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  select: {
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 14,
  } as React.CSSProperties,
  input: {
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  checkbox: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 6,
    fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  } as React.CSSProperties,
  panel: {
    padding: 16,
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    marginBottom: 16,
  } as React.CSSProperties,
  panelTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center' as const,
    gap: 8,
  } as React.CSSProperties,
  badge: (color: string) =>
    ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: color,
      color: '#fff',
    }) as React.CSSProperties,
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  } as React.CSSProperties,
  gateBox: (allowed: boolean) =>
    ({
      padding: 12,
      borderRadius: 6,
      background: allowed ? '#e8f5e9' : '#ffebee',
      border: `1px solid ${allowed ? '#a5d6a7' : '#ef9a9a'}`,
      marginBottom: 8,
      fontSize: 14,
    }) as React.CSSProperties,
  debugPanel: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    background: '#1e1e2e',
    color: '#cdd6f4',
    fontFamily: 'Monaco, Menlo, monospace',
    fontSize: 12,
    maxHeight: 400,
    overflow: 'auto',
  } as React.CSSProperties,
  tab: (active: boolean) =>
    ({
      padding: '8px 16px',
      border: 'none',
      borderBottom: active ? '2px solid #2196f3' : '2px solid transparent',
      background: 'transparent',
      cursor: 'pointer',
      fontWeight: active ? 700 : 400,
      color: active ? '#2196f3' : '#666',
      fontSize: 14,
    }) as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type Role = 'admin' | 'editor' | 'viewer';
type Plan = 'free' | 'starter' | 'pro' | 'enterprise';

const auditEvents: Array<{ time: string; type: string; detail: string }> = [];
const auditPlugin = createAuditLoggerPlugin({
  log: (...args: unknown[]) => {
    const [, type, detail] = args as [string, string, Record<string, unknown>];
    auditEvents.push({
      time: new Date().toLocaleTimeString(),
      type: String(type),
      detail: JSON.stringify(detail, null, 0),
    });
    if (auditEvents.length > 50) auditEvents.shift();
  },
});

function makeConfig(env: string) {
  return defineAccess({
    roles: ['admin', 'editor', 'viewer'] as const,
    permissions: {
      admin: ['*'] as const,
      editor: [
        'articles:read',
        'articles:write',
        'articles:publish',
        'comments:*',
        'media:upload',
      ] as const,
      viewer: ['articles:read', 'comments:read'] as const,
    },
    features: {
      'dark-mode': { enabled: true },
      'new-editor': { rolloutPercentage: 50 },
      'analytics-v2': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
      'beta-feature': { enabled: true, allowedRoles: ['admin'] },
      'ai-assist': { enabled: true, allowedPlans: ['enterprise'] },
      'collab-editing': { rolloutPercentage: 30 },
    },
    experiments: {
      'checkout-flow': {
        id: 'checkout-flow',
        variants: ['control', 'single-page', 'wizard'] as const,
        defaultVariant: 'control',
        active: true,
        allocation: { control: 34, 'single-page': 33, wizard: 33 },
      },
      'cta-color': {
        id: 'cta-color',
        variants: ['blue', 'green', 'orange'] as const,
        defaultVariant: 'blue',
        active: true,
      },
    },
    policies: [
      {
        id: 'owner-edit',
        effect: 'allow' as const,
        permissions: ['articles:edit'],
        condition: ({ user, resource }) => resource?.ownerId === user.id,
        description: 'Users can only edit articles they own',
      },
      {
        id: 'pro-publish',
        effect: 'allow' as const,
        permissions: ['articles:publish'],
        plans: ['pro', 'enterprise'],
        description: 'Publishing requires Pro plan or higher',
      },
    ],
    plans: ['free', 'starter', 'pro', 'enterprise'] as const,
    environment: { name: env },
    plugins: [auditPlugin],
    debug: true,
  });
}

// ---------------------------------------------------------------------------
// Sub-panels
// ---------------------------------------------------------------------------

function IdentityPanel() {
  const { user, roles, permissions } = useAccess();
  const { hasRole } = useRole();
  const { plan, hasPlanAccess } = usePlan();

  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>👤 Identity</h3>
      <div style={styles.row}>
        <span>User ID</span>
        <code>{user.id}</code>
      </div>
      <div style={styles.row}>
        <span>Roles</span>
        <span>
          {roles.map((r) => (
            <span key={r} style={{ ...styles.badge('#2196f3'), marginLeft: 4 }}>
              {r}
            </span>
          ))}
        </span>
      </div>
      <div style={styles.row}>
        <span>Plan</span>
        <span style={styles.badge('#ff9800')}>{plan ?? 'none'}</span>
      </div>
      <div style={styles.row}>
        <span>Permissions</span>
        <span style={{ fontSize: 12, color: '#666' }}>{permissions.length} granted</span>
      </div>

      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Plan Access</h4>
      {(['free', 'starter', 'pro', 'enterprise'] as const).map((p) => (
        <div key={p} style={styles.row}>
          <span>{p}</span>
          <span>{hasPlanAccess(p) ? '✅' : '❌'}</span>
        </div>
      ))}

      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Role Checks</h4>
      {(['admin', 'editor', 'viewer'] as const).map((r) => (
        <div key={r} style={styles.row}>
          <span>{r}</span>
          <span>{hasRole(r) ? '✅' : '❌'}</span>
        </div>
      ))}
    </div>
  );
}

function PermissionPanel() {
  const allPerms = [
    'articles:read',
    'articles:write',
    'articles:publish',
    'comments:read',
    'comments:write',
    'comments:delete',
    'media:upload',
    'billing:manage',
    'users:admin',
  ];

  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>🔑 Permissions</h3>
      {allPerms.map((p) => (
        <PermissionRow key={p} permission={p} />
      ))}
    </div>
  );
}

function PermissionRow({ permission }: { permission: string }) {
  const has = usePermission(permission);
  return (
    <div style={styles.row}>
      <code style={{ fontSize: 13 }}>{permission}</code>
      <span>{has ? '✅' : '❌'}</span>
    </div>
  );
}

function FeaturePanel() {
  const features = [
    'dark-mode',
    'new-editor',
    'analytics-v2',
    'beta-feature',
    'ai-assist',
    'collab-editing',
  ];

  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>🚩 Feature Flags</h3>
      {features.map((f) => (
        <FeatureRow key={f} name={f} />
      ))}
    </div>
  );
}

function FeatureRow({ name }: { name: string }) {
  const { enabled, reason } = useFeature(name);
  return (
    <div style={styles.row}>
      <div>
        <code style={{ fontSize: 13 }}>{name}</code>
        <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>({reason})</span>
      </div>
      <span>{enabled ? '✅ ON' : '❌ OFF'}</span>
    </div>
  );
}

function ExperimentPanel() {
  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>🧪 Experiments</h3>
      <ExperimentRow id="checkout-flow" />
      <ExperimentRow id="cta-color" />

      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Live Variants</h4>
      <Experiment
        id="checkout-flow"
        variants={{
          control: <div style={styles.gateBox(true)}>🛒 Control checkout</div>,
          'single-page': <div style={styles.gateBox(true)}>📄 Single-page checkout</div>,
          wizard: <div style={styles.gateBox(true)}>🧙 Wizard checkout</div>,
        }}
      />
      <Experiment
        id="cta-color"
        variants={{
          blue: <div style={{ ...styles.gateBox(true), background: '#bbdefb' }}>🔵 Blue CTA</div>,
          green: <div style={{ ...styles.gateBox(true), background: '#c8e6c9' }}>🟢 Green CTA</div>,
          orange: (
            <div style={{ ...styles.gateBox(true), background: '#ffe0b2' }}>🟠 Orange CTA</div>
          ),
        }}
      />
    </div>
  );
}

function ExperimentRow({ id }: { id: string }) {
  const { variant, active } = useExperiment(id);
  return (
    <div style={styles.row}>
      <code style={{ fontSize: 13 }}>{id}</code>
      <span>
        {active ? (
          <span style={styles.badge('#4caf50')}>active</span>
        ) : (
          <span style={styles.badge('#999')}>inactive</span>
        )}
        <span style={{ ...styles.badge('#673ab7'), marginLeft: 4 }}>{variant}</span>
      </span>
    </div>
  );
}

function GatePreview() {
  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>🔐 Component Gates</h3>

      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        Live preview of gated UI components. Green = rendered, red = fallback.
      </p>

      <div style={styles.gateBox(true)}>
        <strong>&lt;Can perform="articles:read"&gt;</strong>
      </div>
      <Can
        perform="articles:read"
        fallback={<div style={styles.gateBox(false)}>❌ articles:read denied</div>}
      >
        <div style={styles.gateBox(true)}>✅ articles:read allowed</div>
      </Can>

      <div style={{ ...styles.gateBox(true), background: '#fff' }}>
        <strong>&lt;Can perform="articles:write"&gt;</strong>
      </div>
      <Can
        perform="articles:write"
        fallback={<div style={styles.gateBox(false)}>❌ articles:write denied</div>}
      >
        <div style={styles.gateBox(true)}>✅ articles:write allowed</div>
      </Can>

      <div style={{ ...styles.gateBox(true), background: '#fff' }}>
        <strong>&lt;Feature name="analytics-v2"&gt;</strong>
      </div>
      <Feature
        name="analytics-v2"
        fallback={<div style={styles.gateBox(false)}>❌ analytics-v2 disabled</div>}
      >
        <div style={styles.gateBox(true)}>✅ analytics-v2 enabled</div>
      </Feature>

      <div style={{ ...styles.gateBox(true), background: '#fff' }}>
        <strong>&lt;AccessGate permission="articles:write" feature="new-editor"&gt;</strong>
      </div>
      <AccessGate
        permission="articles:write"
        feature="new-editor"
        fallback={<div style={styles.gateBox(false)}>❌ write + new-editor gate failed</div>}
      >
        <div style={styles.gateBox(true)}>✅ write + new-editor gate passed</div>
      </AccessGate>

      <div style={{ ...styles.gateBox(true), background: '#fff' }}>
        <strong>&lt;PermissionGuard permissions=["media:upload", "articles:publish"]&gt;</strong>
      </div>
      <PermissionGuard
        permissions={['media:upload', 'articles:publish']}
        fallback={<div style={styles.gateBox(false)}>❌ multi-permission guard failed</div>}
      >
        <div style={styles.gateBox(true)}>✅ media:upload + articles:publish guard passed</div>
      </PermissionGuard>
    </div>
  );
}

function PolicyPanel() {
  const ownerResult = usePolicy('articles:edit', { ownerId: 'playground-user' });
  const otherResult = usePolicy('articles:edit', { ownerId: 'someone-else' });

  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>📋 Policy Engine</h3>

      <div style={styles.row}>
        <span>Edit own article (ownerId matches)</span>
        <span>{ownerResult.allowed ? '✅ Allowed' : '❌ Denied'}</span>
      </div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
        Matched: {ownerResult.matchedRule ?? 'none'} | Reason: {ownerResult.reason}
      </div>

      <div style={styles.row}>
        <span>Edit other&apos;s article</span>
        <span>{otherResult.allowed ? '✅ Allowed' : '❌ Denied'}</span>
      </div>
      <div style={{ fontSize: 12, color: '#999' }}>
        Matched: {otherResult.matchedRule ?? 'none'} | Reason: {otherResult.reason}
      </div>
    </div>
  );
}

function DebugReasonPanel() {
  const debug = useAccessDebug();
  const [, setTick] = useState(0);

  return (
    <div style={styles.debugPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: '#89b4fa' }}>Debug Trace</span>
        <button
          onClick={() => setTick((t) => t + 1)}
          style={{
            background: '#313244',
            color: '#cdd6f4',
            border: '1px solid #45475a',
            borderRadius: 4,
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#a6e3a1' }}>Access checks:</span> {debug.lastChecks.length}
        {' | '}
        <span style={{ color: '#f9e2af' }}>Feature evals:</span> {debug.lastFeatureEvals.length}
        {' | '}
        <span style={{ color: '#f38ba8' }}>Policy evals:</span> {debug.lastPolicyEvals.length}
      </div>

      {debug.lastChecks.slice(-5).map((c, i) => (
        <div key={i} style={{ marginBottom: 4, color: c.granted ? '#a6e3a1' : '#f38ba8' }}>
          [{c.granted ? 'ALLOW' : 'DENY'}] {c.permission} — {c.reason ?? 'n/a'}
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <span style={{ color: '#89b4fa', fontWeight: 700 }}>Audit Log (last 10)</span>
      </div>
      {auditEvents.slice(-10).map((e, i) => (
        <div key={i} style={{ marginBottom: 2, fontSize: 11 }}>
          <span style={{ color: '#585b70' }}>{e.time}</span>{' '}
          <span style={{ color: '#fab387' }}>{e.type}</span>{' '}
          <span style={{ color: '#9399b2' }}>{e.detail.slice(0, 100)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'permissions' | 'features' | 'experiments' | 'gates' | 'policies' | 'debug';

export function App() {
  const [role, setRole] = useState<Role>('editor');
  const [plan, setPlan] = useState<Plan>('pro');
  const [userId, setUserId] = useState('playground-user');
  const [env, setEnv] = useState('production');
  const [tab, setTab] = useState<Tab>('overview');

  const config = useMemo(() => makeConfig(env), [env]);
  const user = useMemo(() => ({ id: userId, roles: [role] as const, plan }), [userId, role, plan]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: '👤 Overview' },
    { id: 'permissions', label: '🔑 Permissions' },
    { id: 'features', label: '🚩 Features' },
    { id: 'experiments', label: '🧪 Experiments' },
    { id: 'gates', label: '🔐 Gates' },
    { id: 'policies', label: '📋 Policies' },
    { id: 'debug', label: '🐛 Debug' },
  ];

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>react-access-engine Playground</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>
          Interactive explorer for roles, permissions, features, experiments, policies, and debug
          traces.
        </p>
      </div>

      {/* Controls */}
      <div style={styles.controlBar}>
        <div style={styles.controlGroup}>
          <span style={styles.label}>User ID</span>
          <input style={styles.input} value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div style={styles.controlGroup}>
          <span style={styles.label}>Role</span>
          <select
            style={styles.select}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>
        </div>
        <div style={styles.controlGroup}>
          <span style={styles.label}>Plan</span>
          <select
            style={styles.select}
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
          >
            <option value="free">free</option>
            <option value="starter">starter</option>
            <option value="pro">pro</option>
            <option value="enterprise">enterprise</option>
          </select>
        </div>
        <div style={styles.controlGroup}>
          <span style={styles.label}>Environment</span>
          <select style={styles.select} value={env} onChange={(e) => setEnv(e.target.value)}>
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 24 }}>
        {tabs.map((t) => (
          <button key={t.id} style={styles.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AccessProvider config={config} user={user}>
        {tab === 'overview' && (
          <div style={styles.grid}>
            <IdentityPanel />
            <FeaturePanel />
          </div>
        )}
        {tab === 'permissions' && <PermissionPanel />}
        {tab === 'features' && <FeaturePanel />}
        {tab === 'experiments' && <ExperimentPanel />}
        {tab === 'gates' && <GatePreview />}
        {tab === 'policies' && <PolicyPanel />}
        {tab === 'debug' && <DebugReasonPanel />}
      </AccessProvider>
    </div>
  );
}
