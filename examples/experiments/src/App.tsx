import React, { useState } from 'react';
import { defineAccess, AccessProvider, Experiment, useExperiment } from 'react-access-control';

// ---------------------------------------------------------------------------
// Config — two experiments with variant allocation
// ---------------------------------------------------------------------------
const config = defineAccess({
  roles: ['user'] as const,
  permissions: {
    user: ['app:use'] as const,
  },
  experiments: {
    'checkout-redesign': {
      id: 'checkout-redesign',
      variants: ['control', 'single-page', 'wizard'] as const,
      defaultVariant: 'control',
      active: true,
      allocation: { control: 34, 'single-page': 33, wizard: 33 },
    },
    'pricing-page': {
      id: 'pricing-page',
      variants: ['control', 'annual-first'] as const,
      defaultVariant: 'control',
      active: true,
      allocation: { control: 50, 'annual-first': 50 },
    },
    'onboarding-flow': {
      id: 'onboarding-flow',
      variants: ['classic', 'guided-tour', 'video-intro'] as const,
      defaultVariant: 'classic',
      active: false, // inactive — will always render fallback
    },
  },
});

// ---------------------------------------------------------------------------
// Variant components
// ---------------------------------------------------------------------------
const box = (bg: string): React.CSSProperties => ({
  padding: 16,
  borderRadius: 8,
  background: bg,
  marginBottom: 12,
});

function CheckoutControl() {
  return <div style={box('#e0e0e0')}>🛒 Control checkout — multi-step form</div>;
}
function CheckoutSinglePage() {
  return <div style={box('#c8e6c9')}>🛒 Single-page checkout — everything on one page</div>;
}
function CheckoutWizard() {
  return <div style={box('#bbdefb')}>🛒 Wizard checkout — step-by-step guide</div>;
}

function PricingControl() {
  return <div style={box('#e0e0e0')}>💰 Control pricing — monthly prices shown first</div>;
}
function PricingAnnualFirst() {
  return <div style={box('#fff9c4')}>💰 Annual-first pricing — annual savings highlighted</div>;
}

// ---------------------------------------------------------------------------
// Experiment status panel
// ---------------------------------------------------------------------------
function ExperimentStatus({ id }: { id: string }) {
  const { variant, active } = useExperiment(id);
  return (
    <tr>
      <td style={{ padding: '4px 12px' }}>
        <code>{id}</code>
      </td>
      <td style={{ padding: '4px 12px', textAlign: 'center' }}>{active ? '✅' : '❌'}</td>
      <td style={{ padding: '4px 12px' }}>
        <strong>{variant}</strong>
      </td>
    </tr>
  );
}

function ExperimentDashboard() {
  const experiments = ['checkout-redesign', 'pricing-page', 'onboarding-flow'];

  return (
    <div>
      <h2>Assignment Summary</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '4px 12px' }}>Experiment</th>
            <th style={{ textAlign: 'center', padding: '4px 12px' }}>Active</th>
            <th style={{ textAlign: 'left', padding: '4px 12px' }}>Assigned Variant</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((e) => (
            <ExperimentStatus key={e} id={e} />
          ))}
        </tbody>
      </table>

      <h2>Live Experiments</h2>

      <h3>Checkout Redesign</h3>
      <Experiment
        id="checkout-redesign"
        variants={{
          control: <CheckoutControl />,
          'single-page': <CheckoutSinglePage />,
          wizard: <CheckoutWizard />,
        }}
        fallback={<CheckoutControl />}
      />

      <h3>Pricing Page</h3>
      <Experiment
        id="pricing-page"
        variants={{
          control: <PricingControl />,
          'annual-first': <PricingAnnualFirst />,
        }}
        fallback={<PricingControl />}
      />

      <h3>Onboarding Flow (inactive)</h3>
      <Experiment
        id="onboarding-flow"
        variants={{
          classic: <div style={box('#e0e0e0')}>Classic onboarding</div>,
          'guided-tour': <div style={box('#c8e6c9')}>Guided tour</div>,
          'video-intro': <div style={box('#bbdefb')}>Video intro</div>,
        }}
        fallback={<div style={box('#ffcdd2')}>⚠️ Experiment inactive — showing fallback</div>}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App — change user ID to see different variant assignments
// ---------------------------------------------------------------------------
export function App() {
  const [userId, setUserId] = useState('user-1');

  const user = { id: userId, roles: ['user'] as const };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>A/B Experiments Example</h1>
      <p>
        Change the user ID to see how different users are assigned to different variants based on
        deterministic hashing.
      </p>

      <label style={{ display: 'block', marginBottom: 24 }}>
        User ID:{' '}
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: 4, width: 200 }}
        />
      </label>

      <AccessProvider config={config} user={user}>
        <ExperimentDashboard />
      </AccessProvider>
    </div>
  );
}
