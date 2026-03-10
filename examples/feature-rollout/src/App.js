import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { defineAccess, AccessProvider, Feature, useFeature } from 'react-access-control';
// ---------------------------------------------------------------------------
// Config — Features with percentage rollouts, role restrictions, and plan gates
// ---------------------------------------------------------------------------
const config = defineAccess({
  roles: ['admin', 'user'],
  permissions: {
    admin: ['*'],
    user: ['app:use'],
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
  plans: ['free', 'pro'],
  debug: true,
});
// ---------------------------------------------------------------------------
// Feature status row
// ---------------------------------------------------------------------------
function FeatureStatus({ name }) {
  const { enabled } = useFeature(name);
  return _jsxs('tr', {
    children: [
      _jsx('td', { style: { padding: '6px 12px' }, children: _jsx('code', { children: name }) }),
      _jsx('td', {
        style: { padding: '6px 12px', textAlign: 'center' },
        children: enabled ? '✅ ON' : '❌ OFF',
      }),
    ],
  });
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
  return _jsxs('table', {
    style: { borderCollapse: 'collapse', width: '100%', marginBottom: 24 },
    children: [
      _jsx('thead', {
        children: _jsxs('tr', {
          style: { borderBottom: '2px solid #ccc' },
          children: [
            _jsx('th', { style: { textAlign: 'left', padding: '6px 12px' }, children: 'Feature' }),
            _jsx('th', { style: { textAlign: 'center', padding: '6px 12px' }, children: 'Status' }),
          ],
        }),
      }),
      _jsx('tbody', { children: features.map((f) => _jsx(FeatureStatus, { name: f }, f)) }),
    ],
  });
}
function RolloutDemo() {
  return _jsxs('div', {
    style: { marginBottom: 24 },
    children: [
      _jsx('h3', { children: 'Gated UI sections' }),
      _jsx(Feature, {
        name: 'checkout-v2',
        fallback: _jsx('p', { children: 'Old checkout' }),
        children: _jsx('div', {
          style: { padding: 12, background: '#e8f5e9', borderRadius: 4, marginBottom: 8 },
          children: '\uD83D\uDED2 Checkout V2 \u2014 always enabled',
        }),
      }),
      _jsx(Feature, {
        name: 'new-search',
        fallback: _jsx('p', { style: { color: '#999' }, children: 'Classic search' }),
        children: _jsx('div', {
          style: { padding: 12, background: '#e3f2fd', borderRadius: 4, marginBottom: 8 },
          children: '\uD83D\uDD0D New Search \u2014 50 % rollout (depends on user ID hash)',
        }),
      }),
      _jsx(Feature, {
        name: 'admin-tools',
        fallback: _jsx('p', {
          style: { color: '#999' },
          children: '\uD83D\uDD12 Admin tools hidden',
        }),
        children: _jsx('div', {
          style: { padding: 12, background: '#fff3e0', borderRadius: 4, marginBottom: 8 },
          children: '\uD83D\uDEE0\uFE0F Admin Tools \u2014 role-gated',
        }),
      }),
    ],
  });
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
    roles: [isAdmin ? 'admin' : 'user'],
    plan: isPro ? 'pro' : 'free',
  };
  return _jsxs('div', {
    style: { fontFamily: 'system-ui', maxWidth: 700, margin: '0 auto', padding: 24 },
    children: [
      _jsx('h1', { children: 'Feature Rollout Example' }),
      _jsx('p', {
        children:
          'Change the user ID to see how percentage-based rollouts assign different cohorts. Toggle role and plan to see gated features.',
      }),
      _jsxs('div', {
        style: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
        children: [
          _jsxs('label', {
            children: [
              'User ID:',
              ' ',
              _jsx('input', {
                value: userId,
                onChange: (e) => setUserId(e.target.value),
                style: { padding: 4, width: 140 },
              }),
            ],
          }),
          _jsxs('label', {
            children: [
              _jsx('input', {
                type: 'checkbox',
                checked: isAdmin,
                onChange: (e) => setIsAdmin(e.target.checked),
              }),
              ' ',
              'Admin role',
            ],
          }),
          _jsxs('label', {
            children: [
              _jsx('input', {
                type: 'checkbox',
                checked: isPro,
                onChange: (e) => setIsPro(e.target.checked),
              }),
              ' Pro plan',
            ],
          }),
        ],
      }),
      _jsxs(AccessProvider, {
        config: config,
        user: user,
        children: [_jsx(FeatureMatrix, {}), _jsx(RolloutDemo, {})],
      }),
    ],
  });
}
//# sourceMappingURL=App.js.map
