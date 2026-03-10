import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import {
  defineAccess,
  AccessProvider,
  Can,
  Feature,
  useAccess,
  usePlan,
  useRole,
} from 'react-access-control';
// ---------------------------------------------------------------------------
// Config — SaaS with plan tiers, roles per org, and feature flags
// ---------------------------------------------------------------------------
const config = defineAccess({
  roles: ['owner', 'admin', 'member', 'billing'],
  permissions: {
    owner: ['*'],
    admin: [
      'team:manage',
      'team:invite',
      'settings:read',
      'settings:write',
      'analytics:view',
      'billing:view',
    ],
    member: ['settings:read', 'analytics:view'],
    billing: ['billing:view', 'billing:manage', 'settings:read'],
  },
  features: {
    'advanced-analytics': { enabled: true, allowedPlans: ['business', 'enterprise'] },
    'sso-login': { enabled: true, allowedPlans: ['enterprise'] },
    'custom-branding': { enabled: true, allowedPlans: ['business', 'enterprise'] },
    'api-access': { enabled: true, allowedPlans: ['pro', 'business', 'enterprise'] },
    'audit-log': { enabled: true, allowedPlans: ['enterprise'] },
  },
  plans: ['free', 'pro', 'business', 'enterprise'],
  debug: true,
});
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
const card = {
  padding: 16,
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  marginBottom: 16,
};
function PlanBadge() {
  const { plan, hasPlanAccess } = usePlan();
  return _jsxs('div', {
    style: { ...card, background: '#f5f5f5' },
    children: [
      _jsx('h3', { children: 'Subscription' }),
      _jsxs('p', { children: ['Current plan: ', _jsx('strong', { children: plan })] }),
      _jsx('ul', {
        children: ['free', 'pro', 'business', 'enterprise'].map((p) =>
          _jsxs(
            'li',
            { children: [p, ': ', hasPlanAccess(p) ? '✅ included' : '🔒 upgrade required'] },
            p,
          ),
        ),
      }),
    ],
  });
}
function TeamPanel() {
  return _jsx(Can, {
    perform: 'team:manage',
    fallback: _jsx('p', {
      style: { color: '#999' },
      children: '\uD83D\uDD12 Team management locked',
    }),
    children: _jsxs('div', {
      style: { ...card, background: '#e8f5e9' },
      children: [
        _jsx('h3', { children: 'Team Management' }),
        _jsx('p', { children: 'Invite members, assign roles, manage seats.' }),
        _jsx(Can, {
          perform: 'team:invite',
          children: _jsx('button', { children: '+ Invite Member' }),
        }),
      ],
    }),
  });
}
function BillingPanel() {
  return _jsx(Can, {
    perform: 'billing:view',
    fallback: null,
    children: _jsxs('div', {
      style: { ...card, background: '#fff3e0' },
      children: [
        _jsx('h3', { children: 'Billing' }),
        _jsx('p', { children: 'View invoices and manage payment methods.' }),
        _jsx(Can, {
          perform: 'billing:manage',
          children: _jsx('button', { children: 'Update Payment Method' }),
        }),
      ],
    }),
  });
}
function FeatureGates() {
  return _jsxs('div', {
    style: card,
    children: [
      _jsx('h3', { children: 'Feature Availability' }),
      _jsx(Feature, {
        name: 'advanced-analytics',
        fallback: _jsx('p', {
          children: '\uD83D\uDCCA Advanced Analytics \u2014 upgrade to Business',
        }),
        children: _jsx('p', { children: '\uD83D\uDCCA Advanced Analytics \u2014 \u2705 enabled' }),
      }),
      _jsx(Feature, {
        name: 'sso-login',
        fallback: _jsx('p', { children: '\uD83D\uDD11 SSO Login \u2014 upgrade to Enterprise' }),
        children: _jsx('p', { children: '\uD83D\uDD11 SSO Login \u2014 \u2705 enabled' }),
      }),
      _jsx(Feature, {
        name: 'custom-branding',
        fallback: _jsx('p', {
          children: '\uD83C\uDFA8 Custom Branding \u2014 upgrade to Business',
        }),
        children: _jsx('p', { children: '\uD83C\uDFA8 Custom Branding \u2014 \u2705 enabled' }),
      }),
      _jsx(Feature, {
        name: 'api-access',
        fallback: _jsx('p', { children: '\uD83D\uDD0C API Access \u2014 upgrade to Pro' }),
        children: _jsx('p', { children: '\uD83D\uDD0C API Access \u2014 \u2705 enabled' }),
      }),
      _jsx(Feature, {
        name: 'audit-log',
        fallback: _jsx('p', { children: '\uD83D\uDCDD Audit Log \u2014 upgrade to Enterprise' }),
        children: _jsx('p', { children: '\uD83D\uDCDD Audit Log \u2014 \u2705 enabled' }),
      }),
    ],
  });
}
function Dashboard() {
  const { roles, permissions } = useAccess();
  const { hasRole } = useRole();
  return _jsxs('div', {
    children: [
      _jsxs('div', {
        style: { ...card, background: '#e3f2fd' },
        children: [
          _jsx('h3', { children: 'Your Access' }),
          _jsxs('p', { children: ['Roles: ', roles.join(', ')] }),
          _jsxs('p', { children: ['Permissions: ', permissions.join(', ')] }),
          _jsxs('p', { children: ['Is owner: ', hasRole('owner') ? '✅' : '❌'] }),
        ],
      }),
      _jsx(TeamPanel, {}),
      _jsx(BillingPanel, {}),
      _jsx(FeatureGates, {}),
    ],
  });
}
// ---------------------------------------------------------------------------
// App with role / plan switcher
// ---------------------------------------------------------------------------
export function App() {
  const [role, setRole] = useState('admin');
  const [plan, setPlan] = useState('business');
  const user = { id: 'saas-user', roles: [role], plan };
  return _jsxs('div', {
    style: { fontFamily: 'system-ui', maxWidth: 750, margin: '0 auto', padding: 24 },
    children: [
      _jsx('h1', { children: 'SaaS Dashboard Example' }),
      _jsx('p', { children: 'Switch role and plan to see how access changes.' }),
      _jsxs('div', {
        style: { display: 'flex', gap: 16, marginBottom: 24 },
        children: [
          _jsxs('label', {
            children: [
              'Role:',
              ' ',
              _jsxs('select', {
                value: role,
                onChange: (e) => setRole(e.target.value),
                children: [
                  _jsx('option', { value: 'owner', children: 'owner' }),
                  _jsx('option', { value: 'admin', children: 'admin' }),
                  _jsx('option', { value: 'member', children: 'member' }),
                  _jsx('option', { value: 'billing', children: 'billing' }),
                ],
              }),
            ],
          }),
          _jsxs('label', {
            children: [
              'Plan:',
              ' ',
              _jsxs('select', {
                value: plan,
                onChange: (e) => setPlan(e.target.value),
                children: [
                  _jsx('option', { value: 'free', children: 'free' }),
                  _jsx('option', { value: 'pro', children: 'pro' }),
                  _jsx('option', { value: 'business', children: 'business' }),
                  _jsx('option', { value: 'enterprise', children: 'enterprise' }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsx(AccessProvider, { config: config, user: user, children: _jsx(Dashboard, {}) }),
    ],
  });
}
//# sourceMappingURL=App.js.map
