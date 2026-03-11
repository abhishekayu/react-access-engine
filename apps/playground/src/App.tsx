import React, { useState, useMemo } from 'react';
import {
  defineAccess,
  AccessProvider,
  Allow,
  Can,
  Feature,
  Experiment,
  useAccess,
  useFeature,
  useExperiment,
  usePlan,
  usePolicy,
  useAccessDebug,
  createAuditLoggerPlugin,
} from 'react-access-engine';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STYLES                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const css = {
  root: { fontFamily: "'Inter',system-ui,sans-serif", background: '#f8fafc', minHeight: '100vh', color: '#0f172a' } as React.CSSProperties,
  header: { background: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)', color: '#fff', padding: '32px 0 24px' } as React.CSSProperties,
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 16 } as React.CSSProperties,
  title: { fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' } as React.CSSProperties,
  subtitle: { fontSize: 14, color: '#94a3b8', margin: '6px 0 0' } as React.CSSProperties,
  controls: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', fontSize: 13, cursor: 'pointer', outline: 'none' } as React.CSSProperties,
  badge: (bg: string, fg = '#fff') => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: fg, letterSpacing: '0.3px' }) as React.CSSProperties,
  container: { maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' } as React.CSSProperties,
  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 24 } as React.CSSProperties,
  tab: (active: boolean) => ({ padding: '12px 20px', border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: -2, background: 'none', cursor: 'pointer', fontWeight: active ? 700 : 500, color: active ? '#3b82f6' : '#64748b', fontSize: 14, transition: 'all .15s' }) as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' as const } as React.CSSProperties,
  cardHead: { padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 } as React.CSSProperties,
  cardBody: { padding: 20 } as React.CSSProperties,
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 } as React.CSSProperties,
  code: { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 } as React.CSSProperties,
  gate: (ok: boolean) => ({ padding: '10px 14px', borderRadius: 8, background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`, marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }) as React.CSSProperties,
  product: { display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #f1f5f9', alignItems: 'center' } as React.CSSProperties,
  productImg: { width: 56, height: 56, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 } as React.CSSProperties,
  btn: (bg: string) => ({ padding: '6px 14px', borderRadius: 6, border: 'none', background: bg, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }) as React.CSSProperties,
  debug: { background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: 20, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, maxHeight: 450, overflow: 'auto' as const } as React.CSSProperties,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CONFIG                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

type UserKey = 'customer' | 'plusCustomer' | 'premiumCustomer' | 'seller' | 'admin' | 'support';
const users: Record<UserKey, { id: string; roles: string[]; plan: string; label: string }> = {
  customer:        { id: 'cust-001',    roles: ['customer'], plan: 'free',    label: '🛍️ Customer (Free)' },
  plusCustomer:    { id: 'cust-002',    roles: ['customer'], plan: 'plus',    label: '🛍️ Customer (Plus)' },
  premiumCustomer: { id: 'cust-003',   roles: ['customer'], plan: 'premium', label: '🛍️ Customer (Premium)' },
  seller:          { id: 'seller-001', roles: ['seller'],   plan: 'plus',    label: '📦 Seller' },
  admin:           { id: 'admin-001',  roles: ['admin'],    plan: 'premium', label: '👑 Admin' },
  support:         { id: 'support-001',roles: ['support'],  plan: 'free',    label: '🎧 Support' },
};

const auditLog: Array<{ time: string; type: string; detail: string }> = [];
const auditPlugin = createAuditLoggerPlugin({
  log: (...args: unknown[]) => {
    const [, type, detail] = args as [string, string, Record<string, unknown>];
    auditLog.push({ time: new Date().toLocaleTimeString(), type: String(type), detail: JSON.stringify(detail, null, 0) });
    if (auditLog.length > 50) auditLog.shift();
  },
});

const storeConfig = defineAccess({
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own', 'reviews:write', 'wishlist:manage', 'profile:edit'],
    seller:   ['products:browse', 'products:create', 'products:edit-own', 'orders:seller-view', 'inventory:manage', 'analytics:own-store', 'coupons:create'],
    admin:    ['*'],
    support:  ['products:browse', 'orders:view-all', 'orders:refund', 'reviews:moderate', 'tickets:manage'],
  },
  plans: ['free', 'plus', 'premium'],
  features: {
    'quick-buy':           true,
    'wishlist':            true,
    'reviews-v2':          { rolloutPercentage: 50 },
    'ai-recommendations':  { enabled: true, allowedPlans: ['premium'] },
    'live-chat':           { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points':      { enabled: true, allowedPlans: ['plus', 'premium'] },
    'bulk-discount':       { enabled: true, allowedRoles: ['seller'] },
    'flash-sale':          true,
  },
  experiments: {
    'checkout-layout': {
      id: 'checkout-layout',
      variants: ['classic', 'one-page', 'step-wizard'],
      defaultVariant: 'classic',
      active: true,
      allocation: { classic: 34, 'one-page': 33, 'step-wizard': 33 },
    },
    'promo-banner': {
      id: 'promo-banner',
      variants: ['seasonal', 'loyalty', 'referral'],
      defaultVariant: 'seasonal',
      active: true,
      allocation: { seasonal: 34, loyalty: 33, referral: 33 },
    },
  },
  policies: [
    {
      id: 'seller-own-products',
      effect: 'allow' as const,
      permissions: ['products:edit', 'products:delete'],
      condition: ({ user, resource }: { user: { id: string }; resource: Record<string, unknown> }) =>
        user.id === resource.sellerId,
      description: 'Sellers can only edit/delete their own products',
    },
    {
      id: 'refund-time-limit',
      effect: 'deny' as const,
      permissions: ['orders:refund'],
      condition: ({ resource }: { resource: Record<string, unknown> }) => {
        const days = (Date.now() - (resource.orderedAt as number)) / 86400000;
        return days > 30;
      },
      priority: 100,
      description: 'Block refunds after 30 days',
    },
  ],
  plugins: [auditPlugin],
  debug: true,
});

const products = [
  { emoji: '🎧', name: 'Wireless Headphones', price: 249.99, sellerId: 'seller-001' },
  { emoji: '📱', name: 'Phone Case', price: 29.99,  sellerId: 'seller-002' },
  { emoji: '⌨️', name: 'Mechanical Keyboard', price: 179.99, sellerId: 'seller-001' },
  { emoji: '🖥️', name: '4K Monitor', price: 599.99, sellerId: 'seller-003' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PANELS                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StorePreview() {
  const { can, has } = useAccess();
  return (
    <>
      <div style={css.card}>
        <div style={css.cardHead}>🏪 Live Store Preview</div>
        <div style={css.cardBody}>
          <Feature name="flash-sale">
            <div style={{ padding: '10px 16px', borderRadius: 8, background: 'linear-gradient(90deg,#ef4444,#f97316)', color: '#fff', marginBottom: 16, fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
              🔥 Flash Sale — 40% off everything for the next 2 hours!
            </div>
          </Feature>
          {products.map((p) => (
            <div key={p.name} style={css.product}>
              <div style={css.productImg}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>${p.price}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Allow permission="cart:manage">
                  <button style={css.btn('#3b82f6')}>🛒 Add</button>
                </Allow>
                {has('quick-buy') && can('cart:manage') && (
                  <button style={css.btn('#8b5cf6')}>⚡ Buy</button>
                )}
                <Allow feature="wishlist">
                  <button style={css.btn('#ec4899')}>❤️</button>
                </Allow>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>🤖 AI Recommendations</div>
        <div style={css.cardBody}>
          <Allow feature="ai-recommendations" fallback={
            <div style={css.gate(false)}>🔒 Upgrade to <strong>Premium</strong> to unlock AI-powered recommendations</div>
          }>
            <div style={css.gate(true)}>✅ AI Picks: Wireless Earbuds, USB-C Cable, Phone Stand</div>
          </Allow>
        </div>
      </div>
    </>
  );
}

function PermissionsPanel() {
  const { can, is, has, tier, roles, permissions } = useAccess();
  const { plan } = usePlan();

  const allPerms = ['products:browse', 'cart:manage', 'orders:own', 'orders:view-all', 'orders:refund',
    'reviews:write', 'reviews:moderate', 'inventory:manage', 'analytics:own-store',
    'products:create', 'products:edit-own', 'coupons:create', 'tickets:manage', 'wishlist:manage'];

  return (
    <>
      <div style={css.card}>
        <div style={css.cardHead}>👤 Current User</div>
        <div style={css.cardBody}>
          <div style={css.row}><span>Roles</span><span>{roles.map(r => <span key={r} style={{ ...css.badge('#3b82f6'), marginLeft: 4 }}>{r}</span>)}</span></div>
          <div style={css.row}><span>Plan</span><span style={css.badge('#f59e0b', '#000')}>{plan ?? 'none'}</span></div>
          <div style={css.row}><span>Permissions</span><span style={css.code}>{permissions.length} granted</span></div>
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>🔑 Permission Matrix</div>
        <div style={css.cardBody}>
          {allPerms.map(p => (
            <div key={p} style={css.row}>
              <span style={css.code}>{p}</span>
              <span>{can(p) ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>🛡️ Role & Plan Checks</div>
        <div style={css.cardBody}>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>is(role)</div>
          {['customer', 'seller', 'admin', 'support'].map(r => (
            <div key={r} style={css.row}><span style={css.code}>{r}</span><span>{is(r) ? '✅' : '❌'}</span></div>
          ))}
          <div style={{ fontWeight: 600, fontSize: 12, color: '#64748b', margin: '16px 0 8px', textTransform: 'uppercase' }}>tier(plan)</div>
          {['free', 'plus', 'premium'].map(p => (
            <div key={p} style={css.row}><span style={css.code}>{p}</span><span>{tier(p) ? '✅' : '❌'}</span></div>
          ))}
        </div>
      </div>
    </>
  );
}

function FeaturesPanel() {
  const features = ['quick-buy', 'wishlist', 'reviews-v2', 'ai-recommendations', 'live-chat', 'loyalty-points', 'bulk-discount', 'flash-sale'];
  return (
    <>
      <div style={css.card}>
        <div style={css.cardHead}>🚩 Feature Flags</div>
        <div style={css.cardBody}>
          {features.map(f => <FeatureRow key={f} name={f} />)}
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>🔐 Live Feature Gates</div>
        <div style={css.cardBody}>
          <Feature name="live-chat" fallback={<div style={css.gate(false)}>❌ live-chat — requires Plus plan</div>}>
            <div style={css.gate(true)}>✅ live-chat — enabled</div>
          </Feature>
          <Feature name="loyalty-points" fallback={<div style={css.gate(false)}>❌ loyalty-points — requires Plus plan</div>}>
            <div style={css.gate(true)}>✅ loyalty-points — enabled</div>
          </Feature>
          <Feature name="bulk-discount" fallback={<div style={css.gate(false)}>❌ bulk-discount — seller only</div>}>
            <div style={css.gate(true)}>✅ bulk-discount — enabled</div>
          </Feature>
          <Feature name="ai-recommendations" fallback={<div style={css.gate(false)}>❌ ai-recommendations — Premium only</div>}>
            <div style={css.gate(true)}>✅ ai-recommendations — enabled</div>
          </Feature>
        </div>
      </div>
    </>
  );
}

function FeatureRow({ name }: { name: string }) {
  const { enabled, reason } = useFeature(name);
  return (
    <div style={css.row}>
      <div><span style={css.code}>{name}</span> <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>({reason})</span></div>
      <span style={css.badge(enabled ? '#22c55e' : '#ef4444')}>{enabled ? 'ON' : 'OFF'}</span>
    </div>
  );
}

function ExperimentsPanel() {
  return (
    <>
      <div style={css.card}>
        <div style={css.cardHead}>🧪 Experiment Assignments</div>
        <div style={css.cardBody}>
          <ExpRow id="checkout-layout" />
          <ExpRow id="promo-banner" />
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>🎯 Promo Banner (Experiment component)</div>
        <div style={css.cardBody}>
          <Experiment
            id="promo-banner"
            variants={{
              seasonal: <div style={{ ...css.gate(true), background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none' }}>🎄 Winter Sale — 50% off everything!</div>,
              loyalty:  <div style={{ ...css.gate(true), background: 'linear-gradient(135deg,#f093fb,#f5576c)', color: '#fff', border: 'none' }}>⭐ Double Points Week — Earn 2x!</div>,
              referral: <div style={{ ...css.gate(true), background: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: '#fff', border: 'none' }}>👥 Refer & Save — Give $10, Get $10</div>,
            }}
          />
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>🛒 Checkout Layout (useExperiment hook)</div>
        <div style={css.cardBody}>
          <CheckoutPreview />
        </div>
      </div>
    </>
  );
}

function CheckoutPreview() {
  const { variant } = useExperiment('checkout-layout');
  const layouts: Record<string, { icon: string; label: string; desc: string }> = {
    classic:       { icon: '📋', label: 'Classic Checkout', desc: 'Traditional multi-section layout' },
    'one-page':    { icon: '📄', label: 'One-Page Checkout', desc: 'Everything on a single scrollable page' },
    'step-wizard': { icon: '🧙', label: 'Step Wizard', desc: 'Guided step-by-step process' },
  };
  const l = layouts[variant] ?? layouts.classic!;
  return (
    <div style={{ ...css.gate(true), flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{l!.icon} {l!.label}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>Assigned variant: <strong>{variant}</strong> — {l!.desc}</div>
    </div>
  );
}

function ExpRow({ id }: { id: string }) {
  const { variant, active } = useExperiment(id);
  return (
    <div style={css.row}>
      <span style={css.code}>{id}</span>
      <span>
        <span style={{ ...css.badge(active ? '#22c55e' : '#94a3b8'), marginRight: 6 }}>{active ? 'active' : 'off'}</span>
        <span style={css.badge('#8b5cf6')}>{variant}</span>
      </span>
    </div>
  );
}

function PoliciesPanel() {
  const ownProduct = usePolicy('products:edit', { sellerId: 'seller-001' });
  const otherProduct = usePolicy('products:edit', { sellerId: 'someone-else' });
  const recentOrder = usePolicy('orders:refund', { orderedAt: Date.now() - 5 * 86400000 });
  const oldOrder = usePolicy('orders:refund', { orderedAt: Date.now() - 60 * 86400000 });

  return (
    <div style={css.card}>
      <div style={css.cardHead}>📋 ABAC Policy Engine</div>
      <div style={css.cardBody}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
          Policies evaluate dynamically based on user attributes and resource context.
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Seller Product Ownership</div>
        <div style={css.gate(ownProduct.allowed)}>
          {ownProduct.allowed ? '✅' : '❌'} products:edit on <strong>own product</strong> (sellerId=seller-001)
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{ownProduct.reason}</span>
        </div>
        <div style={css.gate(otherProduct.allowed)}>
          {otherProduct.allowed ? '✅' : '❌'} products:edit on <strong>other&apos;s product</strong> (sellerId=someone-else)
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{otherProduct.reason}</span>
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, margin: '20px 0 8px' }}>Refund Time Limit (30 days)</div>
        <div style={css.gate(recentOrder.allowed)}>
          {recentOrder.allowed ? '✅' : '❌'} orders:refund — <strong>5-day-old order</strong>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{recentOrder.reason}</span>
        </div>
        <div style={css.gate(oldOrder.allowed)}>
          {oldOrder.allowed ? '✅' : '❌'} orders:refund — <strong>60-day-old order</strong>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{oldOrder.reason}</span>
        </div>
      </div>
    </div>
  );
}

function GatesPanel() {
  return (
    <>
      <div style={css.card}>
        <div style={css.cardHead}>🔐 Component Gates — Live Preview</div>
        <div style={css.cardBody}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            Switch users above to see how each gate responds in real time.
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{'<Allow>'} — Permission Gates</div>
          <Allow permission="cart:manage" fallback={<div style={css.gate(false)}>❌ cart:manage denied</div>}>
            <div style={css.gate(true)}>✅ cart:manage — allowed</div>
          </Allow>
          <Allow permission="inventory:manage" fallback={<div style={css.gate(false)}>❌ inventory:manage denied</div>}>
            <div style={css.gate(true)}>✅ inventory:manage — allowed</div>
          </Allow>
          <Allow permission="orders:refund" fallback={<div style={css.gate(false)}>❌ orders:refund denied</div>}>
            <div style={css.gate(true)}>✅ orders:refund — allowed</div>
          </Allow>

          <div style={{ fontWeight: 700, fontSize: 13, margin: '16px 0 8px' }}>{'<Allow>'} — Role Gates</div>
          <Allow role="seller" fallback={<div style={css.gate(false)}>❌ role=seller denied</div>}>
            <div style={css.gate(true)}>✅ role=seller — Seller Dashboard visible</div>
          </Allow>
          <Allow role="admin" fallback={<div style={css.gate(false)}>❌ role=admin denied</div>}>
            <div style={css.gate(true)}>✅ role=admin — Admin Panel visible</div>
          </Allow>
          <Allow role="support" fallback={<div style={css.gate(false)}>❌ role=support denied</div>}>
            <div style={css.gate(true)}>✅ role=support — Support Tools visible</div>
          </Allow>

          <div style={{ fontWeight: 700, fontSize: 13, margin: '16px 0 8px' }}>{'<Allow>'} — Plan + Feature</div>
          <Allow plan="plus" fallback={<div style={css.gate(false)}>❌ plan=plus — Upgrade to Plus</div>}>
            <div style={css.gate(true)}>✅ plan≥plus — Live Chat available</div>
          </Allow>
          <Allow feature="ai-recommendations" fallback={<div style={css.gate(false)}>❌ ai-recommendations — Premium only</div>}>
            <div style={css.gate(true)}>✅ ai-recommendations — AI enabled</div>
          </Allow>
        </div>
      </div>

      <div style={css.card}>
        <div style={css.cardHead}>📦 {'<Can>'} — Seller Dashboard</div>
        <div style={css.cardBody}>
          <Allow role="seller" fallback={<div style={css.gate(false)}>❌ Not a seller — dashboard hidden</div>}>
            <Can perform="inventory:manage" fallback={<div style={css.gate(false)}>❌ inventory:manage</div>}>
              <div style={css.gate(true)}>✅ Inventory Manager</div>
            </Can>
            <Can perform="analytics:own-store" fallback={<div style={css.gate(false)}>❌ analytics:own-store</div>}>
              <div style={css.gate(true)}>✅ Store Analytics</div>
            </Can>
            <Can perform="coupons:create" fallback={<div style={css.gate(false)}>❌ coupons:create</div>}>
              <div style={css.gate(true)}>✅ Create Coupons</div>
            </Can>
            <Feature name="bulk-discount" fallback={<div style={css.gate(false)}>❌ bulk-discount flag off</div>}>
              <div style={css.gate(true)}>✅ Bulk Discount Pricing</div>
            </Feature>
          </Allow>
        </div>
      </div>
    </>
  );
}

function DebugPanel() {
  const debug = useAccessDebug();
  const [, refresh] = useState(0);

  return (
    <div style={css.card}>
      <div style={css.cardHead}>🐛 Debug Trace & Audit Log</div>
      <div style={{ padding: 0 }}>
        <div style={css.debug}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>Live Debug Trace</span>
            <button onClick={() => refresh(t => t + 1)} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}>Refresh</button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: '#4ade80' }}>Access checks:</span> {debug.lastChecks.length}
            {' | '}<span style={{ color: '#fbbf24' }}>Feature evals:</span> {debug.lastFeatureEvals.length}
            {' | '}<span style={{ color: '#f87171' }}>Policy evals:</span> {debug.lastPolicyEvals.length}
          </div>
          {debug.lastChecks.slice(-8).map((c, i) => (
            <div key={i} style={{ marginBottom: 3, color: c.granted ? '#4ade80' : '#f87171' }}>
              [{c.granted ? 'ALLOW' : 'DENY'}] {c.permission} — {c.reason ?? 'n/a'}
            </div>
          ))}
          <div style={{ margin: '16px 0 8px', color: '#60a5fa', fontWeight: 700 }}>Audit Log (last 10)</div>
          {auditLog.slice(-10).map((e, i) => (
            <div key={i} style={{ marginBottom: 2, fontSize: 11 }}>
              <span style={{ color: '#475569' }}>{e.time}</span>{' '}
              <span style={{ color: '#fb923c' }}>{e.type}</span>{' '}
              <span style={{ color: '#94a3b8' }}>{e.detail.slice(0, 120)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  APP                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

type Tab = 'store' | 'permissions' | 'features' | 'experiments' | 'policies' | 'gates' | 'debug';
const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'store',       label: '🏪 Store' },
  { id: 'permissions', label: '🔑 Permissions' },
  { id: 'features',    label: '🚩 Features' },
  { id: 'experiments', label: '🧪 Experiments' },
  { id: 'policies',    label: '📋 Policies' },
  { id: 'gates',       label: '🔐 Gates' },
  { id: 'debug',       label: '🐛 Debug' },
];

export function App() {
  const [userKey, setUserKey] = useState<UserKey>('customer');
  const [tab, setTab] = useState<Tab>('store');
  const currentUser = useMemo(() => users[userKey], [userKey]);

  return (
    <div style={css.root}>
      <header style={css.header}>
        <div style={css.headerInner}>
          <div>
            <h1 style={css.title}>⚡ react-access-engine</h1>
            <p style={css.subtitle}>Interactive E-commerce Playground — explore every feature in real time</p>
          </div>
          <div style={css.controls}>
            <select style={css.select} value={userKey} onChange={e => setUserKey(e.target.value as UserKey)}>
              {Object.entries(users).map(([k, u]) => (
                <option key={k} value={k}>{u.label}</option>
              ))}
            </select>
            <span style={css.badge('#3b82f6')}>{currentUser.roles[0]}</span>
            <span style={css.badge('#f59e0b', '#000')}>{currentUser.plan}</span>
          </div>
        </div>
      </header>

      <div style={css.container}>
        <div style={css.tabs}>
          {tabs.map(t => (
            <button key={t.id} style={css.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <AccessProvider config={storeConfig} user={currentUser}>
          <div style={css.grid}>
            {tab === 'store' && <StorePreview />}
            {tab === 'permissions' && <PermissionsPanel />}
            {tab === 'features' && <FeaturesPanel />}
            {tab === 'experiments' && <ExperimentsPanel />}
            {tab === 'policies' && <PoliciesPanel />}
            {tab === 'gates' && <GatesPanel />}
            {tab === 'debug' && <DebugPanel />}
          </div>
        </AccessProvider>
      </div>
    </div>
  );
}
