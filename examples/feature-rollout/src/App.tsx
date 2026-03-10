import React, { useState } from 'react';
import { defineAccess, AccessProvider, Feature, useFeature } from 'react-access-engine';

// ---------------------------------------------------------------------------
// Config — Features with percentage rollouts, role restrictions, and plan gates
// ---------------------------------------------------------------------------
const config = defineAccess({
  roles: ['admin', 'user'] as const,
  permissions: {
    admin: ['*'] as const,
    user: ['app:use'] as const,
  },
  features: {
    // 100 % — always on
    'checkout-v2': { enabled: true },
    // 50 % rollout — based on user-id hash
    'new-search': { rolloutPercentage: 50 },
    // 10 % canary
    'experimental-ui': { rolloutPercentage: 10 },
    // role-gated
    'admin-tools': { enabled: true, allowedRoles: ['admin'] },
    // plan-gated
    'priority-support': { enabled: true, allowedPlans: ['pro'] },
    // disabled
    'upcoming-feature': { enabled: false },
  },
  plans: ['free', 'pro'] as const,
  debug: true,
});

// ---------------------------------------------------------------------------
// Feature status row
// ---------------------------------------------------------------------------
function FeatureStatus({ name }: { name: string }) {
  const { enabled } = useFeature(name);
  return (
    <tr>
      <td style={{ padding: '6px 12px' }}>
        <code>{name}</code>
      </td>
      <td style={{ padding: '6px 12px', textAlign: 'center' }}>{enabled ? '✅ ON' : '❌ OFF'}</td>
    </tr>
  );
}

function FeatureMatrix() {
  const features = [
    'checkout-v2',
    'new-search',
    'experimental-ui',
    'admin-tools',
    'priority-support',
    'upcoming-feature',
  ];

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 24 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #ccc' }}>
          <th style={{ textAlign: 'left', padding: '6px 12px' }}>Feature</th>
          <th style={{ textAlign: 'center', padding: '6px 12px' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {features.map((f) => (
          <FeatureStatus key={f} name={f} />
        ))}
      </tbody>
    </table>
  );
}

function RolloutDemo() {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>Gated UI sections</h3>

      <Feature name="checkout-v2" fallback={<p>Old checkout</p>}>
        <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 4, marginBottom: 8 }}>
          🛒 Checkout V2 — always enabled
        </div>
      </Feature>

      <Feature name="new-search" fallback={<p style={{ color: '#999' }}>Classic search</p>}>
        <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 4, marginBottom: 8 }}>
          🔍 New Search — 50 % rollout (depends on user ID hash)
        </div>
      </Feature>

      <Feature name="admin-tools" fallback={<p style={{ color: '#999' }}>🔒 Admin tools hidden</p>}>
        <div style={{ padding: 12, background: '#fff3e0', borderRadius: 4, marginBottom: 8 }}>
          🛠️ Admin Tools — role-gated
        </div>
      </Feature>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App — change user ID to see different rollout cohorts
// ---------------------------------------------------------------------------
export function App() {
  const [userId, setUserId] = useState('user-42');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const user = {
    id: userId,
    roles: [isAdmin ? 'admin' : 'user'] as const,
    plan: isPro ? ('pro' as const) : ('free' as const),
  };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Feature Rollout Example</h1>
      <p>
        Change the user ID to see how percentage-based rollouts assign different cohorts. Toggle
        role and plan to see gated features.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <label>
          User ID:{' '}
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: 4, width: 140 }}
          />
        </label>
        <label>
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />{' '}
          Admin role
        </label>
        <label>
          <input type="checkbox" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} /> Pro
          plan
        </label>
      </div>

      <AccessProvider config={config} user={user}>
        <FeatureMatrix />
        <RolloutDemo />
      </AccessProvider>
    </div>
  );
}
