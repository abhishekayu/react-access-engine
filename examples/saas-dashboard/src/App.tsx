import React, { useState } from 'react';
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
  roles: ['owner', 'admin', 'member', 'billing'] as const,
  permissions: {
    owner: ['*'] as const,
    admin: [
      'team:manage',
      'team:invite',
      'settings:read',
      'settings:write',
      'analytics:view',
      'billing:view',
    ] as const,
    member: ['settings:read', 'analytics:view'] as const,
    billing: ['billing:view', 'billing:manage', 'settings:read'] as const,
  },
  features: {
    'advanced-analytics': { enabled: true, allowedPlans: ['business', 'enterprise'] },
    'sso-login': { enabled: true, allowedPlans: ['enterprise'] },
    'custom-branding': { enabled: true, allowedPlans: ['business', 'enterprise'] },
    'api-access': { enabled: true, allowedPlans: ['pro', 'business', 'enterprise'] },
    'audit-log': { enabled: true, allowedPlans: ['enterprise'] },
  },
  plans: ['free', 'pro', 'business', 'enterprise'] as const,
  debug: true,
});

type Role = 'owner' | 'admin' | 'member' | 'billing';
type Plan = 'free' | 'pro' | 'business' | 'enterprise';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
const card = {
  padding: 16,
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  marginBottom: 16,
} as const;

function PlanBadge() {
  const { plan, hasPlanAccess } = usePlan();
  return (
    <div style={{ ...card, background: '#f5f5f5' }}>
      <h3>Subscription</h3>
      <p>
        Current plan: <strong>{plan}</strong>
      </p>
      <ul>
        {(['free', 'pro', 'business', 'enterprise'] as const).map((p) => (
          <li key={p}>
            {p}: {hasPlanAccess(p) ? '✅ included' : '🔒 upgrade required'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamPanel() {
  return (
    <Can
      perform="team:manage"
      fallback={<p style={{ color: '#999' }}>🔒 Team management locked</p>}
    >
      <div style={{ ...card, background: '#e8f5e9' }}>
        <h3>Team Management</h3>
        <p>Invite members, assign roles, manage seats.</p>
        <Can perform="team:invite">
          <button>+ Invite Member</button>
        </Can>
      </div>
    </Can>
  );
}

function BillingPanel() {
  return (
    <Can perform="billing:view" fallback={null}>
      <div style={{ ...card, background: '#fff3e0' }}>
        <h3>Billing</h3>
        <p>View invoices and manage payment methods.</p>
        <Can perform="billing:manage">
          <button>Update Payment Method</button>
        </Can>
      </div>
    </Can>
  );
}

function FeatureGates() {
  return (
    <div style={card}>
      <h3>Feature Availability</h3>

      <Feature
        name="advanced-analytics"
        fallback={<p>📊 Advanced Analytics — upgrade to Business</p>}
      >
        <p>📊 Advanced Analytics — ✅ enabled</p>
      </Feature>

      <Feature name="sso-login" fallback={<p>🔑 SSO Login — upgrade to Enterprise</p>}>
        <p>🔑 SSO Login — ✅ enabled</p>
      </Feature>

      <Feature name="custom-branding" fallback={<p>🎨 Custom Branding — upgrade to Business</p>}>
        <p>🎨 Custom Branding — ✅ enabled</p>
      </Feature>

      <Feature name="api-access" fallback={<p>🔌 API Access — upgrade to Pro</p>}>
        <p>🔌 API Access — ✅ enabled</p>
      </Feature>

      <Feature name="audit-log" fallback={<p>📝 Audit Log — upgrade to Enterprise</p>}>
        <p>📝 Audit Log — ✅ enabled</p>
      </Feature>
    </div>
  );
}

function Dashboard() {
  const { roles, permissions } = useAccess();
  const { hasRole } = useRole();

  return (
    <div>
      <div style={{ ...card, background: '#e3f2fd' }}>
        <h3>Your Access</h3>
        <p>Roles: {roles.join(', ')}</p>
        <p>Permissions: {permissions.join(', ')}</p>
        <p>Is owner: {hasRole('owner') ? '✅' : '❌'}</p>
      </div>
      <PlanBadge />
      <TeamPanel />
      <BillingPanel />
      <FeatureGates />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App with role / plan switcher
// ---------------------------------------------------------------------------
export function App() {
  const [role, setRole] = useState<Role>('admin');
  const [plan, setPlan] = useState<Plan>('business');

  const user = { id: 'saas-user', roles: [role] as const, plan };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 750, margin: '0 auto', padding: 24 }}>
      <h1>SaaS Dashboard Example</h1>
      <p>Switch role and plan to see how access changes.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <label>
          Role:{' '}
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="member">member</option>
            <option value="billing">billing</option>
          </select>
        </label>
        <label>
          Plan:{' '}
          <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
            <option value="free">free</option>
            <option value="pro">pro</option>
            <option value="business">business</option>
            <option value="enterprise">enterprise</option>
          </select>
        </label>
      </div>

      <AccessProvider config={config} user={user}>
        <Dashboard />
      </AccessProvider>
    </div>
  );
}
