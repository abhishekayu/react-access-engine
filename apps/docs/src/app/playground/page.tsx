'use client';

import { useState, useMemo } from 'react';
import {
  defineAccess,
  AccessProvider,
  Allow,
  Can,
  Feature,
  FeatureToggle,
  Experiment,
  AccessGate,
  PermissionGuard,
  useAccess,
  usePermission,
  useRole,
  useFeature,
  useExperiment,
  usePlan,
  usePolicy,
  useAccessDebug,
} from 'react-access-engine';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/code-block';

/* ────────── Users ────────── */

type UserKey = 'customer' | 'plusCustomer' | 'premiumCustomer' | 'seller' | 'admin' | 'support';

const users: Record<UserKey, { id: string; roles: string[]; plan: string; label: string; desc: string }> = {
  customer:        { id: 'cust-001',    roles: ['customer'], plan: 'free',    label: 'Free Customer',    desc: 'Basic access, free plan' },
  plusCustomer:    { id: 'cust-002',    roles: ['customer'], plan: 'plus',    label: 'Plus Customer',    desc: 'Customer on Plus plan' },
  premiumCustomer: { id: 'cust-003',   roles: ['customer'], plan: 'premium', label: 'Premium Customer', desc: 'Customer on Premium plan' },
  seller:          { id: 'seller-001',  roles: ['seller'],   plan: 'plus',   label: 'Seller',           desc: 'Store owner, manages products' },
  admin:           { id: 'admin-001',   roles: ['admin'],    plan: 'premium', label: 'Admin',           desc: 'Full access to everything' },
  support:         { id: 'support-001', roles: ['support'],  plan: 'free',   label: 'Support Agent',    desc: 'Order management, ticket support' },
};

/* ────────── Config ────────── */

const storeConfig = defineAccess({
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own', 'reviews:write', 'wishlist:manage'],
    seller:   ['products:browse', 'products:create', 'products:edit-own', 'inventory:manage', 'analytics:own-store', 'coupons:create'],
    admin:    ['*'],
    support:  ['products:browse', 'orders:view-all', 'orders:refund', 'reviews:moderate', 'tickets:manage'],
  },
  plans: ['free', 'plus', 'premium'],
  features: {
    'quick-buy':          true,
    'wishlist':           true,
    'ai-recommendations': { enabled: true, allowedPlans: ['premium'] },
    'live-chat':          { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points':     { enabled: true, allowedPlans: ['plus', 'premium'] },
    'bulk-discount':      { enabled: true, allowedRoles: ['seller'] },
    'flash-sale':         true,
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
  debug: true,
});

/* ────────── Shared UI ────────── */

function Result({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] mb-1.5 last:mb-0',
      ok
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-300'
        : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-300'
    )}>
      <span className="shrink-0 text-xs">{ok ? '✓' : '✗'}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function Section({ title, hook, children }: { title: string; hook?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{title}</span>
        {hook && <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{hook}</code>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
      active
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
    )}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════
   Tab 1 — Store Preview
   Shows: <Allow>, <Feature>, useAccess()
   ═══════════════════════════════════════════ */

const products = [
  { emoji: '🎧', name: 'Wireless Headphones', price: 249.99, sellerId: 'seller-001' },
  { emoji: '📱', name: 'Phone Case', price: 29.99, sellerId: 'seller-002' },
  { emoji: '⌨️', name: 'Mechanical Keyboard', price: 179.99, sellerId: 'seller-001' },
  { emoji: '🖥️', name: '4K Monitor', price: 599.99, sellerId: 'seller-003' },
];

function StoreTab() {
  const { can, has } = useAccess();

  return (
    <div className="space-y-4">
      <Section title="Product Catalog" hook="<Allow> + useAccess()">
        <Feature name="flash-sale">
          <div className="mb-3 rounded-md bg-zinc-900 px-3 py-2 text-center text-[12px] font-semibold text-white dark:bg-zinc-800">
            ⚡ Flash Sale — 40% off everything for the next 2 hours
          </div>
        </Feature>
        {products.map(p => (
          <div key={p.name} className="flex items-center gap-3 border-b border-zinc-100 py-2.5 last:border-b-0 dark:border-zinc-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-lg dark:bg-zinc-800">{p.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-zinc-900 dark:text-white">{p.name}</div>
              <div className="text-[12px] text-zinc-400">${p.price}</div>
            </div>
            <div className="flex gap-1">
              <Allow permission="cart:manage">
                <button className="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Add to Cart</button>
              </Allow>
              {has('quick-buy') && can('cart:manage') && (
                <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300">Buy Now</button>
              )}
              <Allow feature="wishlist">
                <button className="rounded-md px-2 py-1 text-[12px] text-zinc-400 hover:text-red-500">♥</button>
              </Allow>
            </div>
          </div>
        ))}
      </Section>

      <Section title="AI Recommendations" hook="<Allow feature>">
        <Allow feature="ai-recommendations" fallback={<Result ok={false}>Upgrade to <strong>Premium</strong> to unlock AI-powered recommendations</Result>}>
          <Result ok>Recommended for you: Wireless Earbuds, USB-C Cable, Phone Stand</Result>
        </Allow>
      </Section>

      <Section title="Live Chat" hook="<Feature>">
        <Feature name="live-chat" fallback={<Result ok={false}>Live chat requires Plus or Premium plan</Result>}>
          <Result ok>Live chat widget active — agent online</Result>
        </Feature>
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { Allow, Feature, useAccess } from 'react-access-engine';

// Declarative gate
<Allow permission="cart:manage">
  <AddToCartButton />
</Allow>

// Feature flag gate
<Feature name="live-chat" fallback={<UpgradeBanner />}>
  <ChatWidget />
</Feature>

// Imperative check
const { can, has } = useAccess();
if (has('quick-buy') && can('cart:manage')) {
  // show Buy Now button
}`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 2 — RBAC
   Shows: useAccess(), usePermission(), useRole(), usePlan()
   ═══════════════════════════════════════════ */

function RBACTab() {
  const { can, is, tier, roles, permissions } = useAccess();
  const { plan, hasPlanAccess } = usePlan();
  const { hasRole, hasAnyRole, hasAllRoles } = useRole();

  // usePermission() — individual hook
  const canBrowse = usePermission('products:browse');
  const canRefund = usePermission('orders:refund');
  const canCreate = usePermission('products:create');
  const canModerate = usePermission('reviews:moderate');

  const allPerms = [
    'products:browse', 'cart:manage', 'orders:own', 'orders:view-all', 'orders:refund',
    'reviews:write', 'reviews:moderate', 'inventory:manage', 'analytics:own-store',
    'products:create', 'coupons:create', 'tickets:manage', 'wishlist:manage',
  ];

  return (
    <div className="space-y-4">
      <Section title="Current Identity" hook="useAccess()">
        <div className="grid grid-cols-3 gap-3 text-[13px]">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Roles</div>
            <div className="flex flex-wrap gap-1">{roles.map(r => <Pill key={r} active>{r}</Pill>)}</div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Plan</div>
            <Pill active>{plan ?? 'none'}</Pill>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Granted</div>
            <span className="font-mono text-[13px] text-zinc-900 dark:text-white">{permissions.length} perms</span>
          </div>
        </div>
      </Section>

      <Section title="usePermission()" hook="usePermission(perm)">
        <p className="mb-2 text-[12px] text-zinc-400">Individual permission hook — returns a boolean directly</p>
        <Result ok={canBrowse}>usePermission(&apos;products:browse&apos;) → {String(canBrowse)}</Result>
        <Result ok={canRefund}>usePermission(&apos;orders:refund&apos;) → {String(canRefund)}</Result>
        <Result ok={canCreate}>usePermission(&apos;products:create&apos;) → {String(canCreate)}</Result>
        <Result ok={canModerate}>usePermission(&apos;reviews:moderate&apos;) → {String(canModerate)}</Result>
      </Section>

      <Section title="Permission Matrix" hook="can(permission)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          {allPerms.map(p => (
            <div key={p} className="flex items-center justify-between border-b border-zinc-50 py-1.5 dark:border-zinc-800/50">
              <code className="text-[12px] text-zinc-600 dark:text-zinc-300">{p}</code>
              <span className="text-[12px]">{can(p) ? '✓' : '—'}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Section title="useRole()" hook="useRole()">
          <p className="mb-2 text-[11px] text-zinc-400">hasRole, hasAnyRole, hasAllRoles</p>
          {['customer', 'seller', 'admin', 'support'].map(r => (
            <div key={r} className="flex items-center justify-between py-1 text-[13px]">
              <code className="text-[12px]">{r}</code>
              <Pill active={hasRole(r)}>{hasRole(r) ? 'yes' : 'no'}</Pill>
            </div>
          ))}
          <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            <div className="flex items-center justify-between py-1 text-[12px]">
              <span className="text-zinc-500">hasAnyRole([&apos;admin&apos;, &apos;support&apos;])</span>
              <Pill active={hasAnyRole(['admin', 'support'])}>{hasAnyRole(['admin', 'support']) ? 'yes' : 'no'}</Pill>
            </div>
            <div className="flex items-center justify-between py-1 text-[12px]">
              <span className="text-zinc-500">hasAllRoles([&apos;admin&apos;, &apos;seller&apos;])</span>
              <Pill active={hasAllRoles(['admin', 'seller'])}>{hasAllRoles(['admin', 'seller']) ? 'yes' : 'no'}</Pill>
            </div>
          </div>
        </Section>

        <Section title="is(role)" hook="useAccess()">
          {['customer', 'seller', 'admin', 'support'].map(r => (
            <div key={r} className="flex items-center justify-between py-1 text-[13px]">
              <code className="text-[12px]">{r}</code>
              <Pill active={is(r)}>{is(r) ? 'yes' : 'no'}</Pill>
            </div>
          ))}
        </Section>

        <Section title="Plan Access" hook="usePlan()">
          <p className="mb-2 text-[11px] text-zinc-400">tier() from useAccess + hasPlanAccess() from usePlan</p>
          {['free', 'plus', 'premium'].map(p => (
            <div key={p} className="flex items-center justify-between py-1 text-[13px]">
              <code className="text-[12px]">{p}</code>
              <div className="flex gap-1">
                <Pill active={tier(p)}>tier</Pill>
                <Pill active={hasPlanAccess(p)}>plan</Pill>
              </div>
            </div>
          ))}
        </Section>
      </div>

      <Section title="Usage">
        <CodeBlock code={`import { useAccess, usePermission, useRole, usePlan } from 'react-access-engine';

// Primary hook — shorthand methods
const { can, is, has, tier, roles, permissions } = useAccess();
can('products:edit');       // boolean
is('admin');               // boolean
has('live-chat');          // boolean (feature flag)
tier('premium');           // boolean (plan check)

// Individual permission hook
const canRefund = usePermission('orders:refund');

// Role hook — full role utilities
const { hasRole, hasAnyRole, hasAllRoles } = useRole();
hasRole('admin');                      // boolean
hasAnyRole(['admin', 'support']);       // boolean
hasAllRoles(['admin', 'seller']);       // boolean

// Plan hook — plan tier checking
const { plan, hasPlanAccess } = usePlan();
hasPlanAccess('plus');  // true if user plan >= plus`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 3 — Feature Flags
   Shows: useFeature(), <Feature>, <FeatureToggle>
   ═══════════════════════════════════════════ */

function FeaturesTab() {
  const allFeatures = ['quick-buy', 'wishlist', 'ai-recommendations', 'live-chat', 'loyalty-points', 'bulk-discount', 'flash-sale'];

  return (
    <div className="space-y-4">
      <Section title="Flag Status" hook="useFeature()">
        {allFeatures.map(f => <FeatureRow key={f} name={f} />)}
      </Section>

      <Section title="<Feature> Component" hook="<Feature>">
        <p className="mb-2 text-[12px] text-zinc-400">Declarative — children render only when feature is enabled</p>
        <Feature name="live-chat" fallback={<Result ok={false}>live-chat — requires Plus plan</Result>}>
          <Result ok>live-chat — enabled</Result>
        </Feature>
        <Feature name="ai-recommendations" fallback={<Result ok={false}>ai-recommendations — Premium only</Result>}>
          <Result ok>ai-recommendations — enabled</Result>
        </Feature>
        <Feature name="bulk-discount" fallback={<Result ok={false}>bulk-discount — seller only</Result>}>
          <Result ok>bulk-discount — enabled</Result>
        </Feature>
      </Section>

      <Section title="<FeatureToggle> Render Prop" hook="<FeatureToggle>">
        <p className="mb-2 text-[12px] text-zinc-400">Render prop pattern — always renders, gives you the state</p>
        {allFeatures.map(f => (
          <FeatureToggle key={f} name={f}>
            {({ enabled, reason }) => (
              <div className="flex items-center justify-between border-b border-zinc-50 py-1.5 last:border-b-0 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <code className="text-[12px] text-zinc-700 dark:text-zinc-300">{f}</code>
                  <span className="text-[11px] text-zinc-400">({reason})</span>
                </div>
                <Pill active={enabled}>{enabled ? 'ON' : 'OFF'}</Pill>
              </div>
            )}
          </FeatureToggle>
        ))}
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { useFeature, Feature, FeatureToggle } from 'react-access-engine';

// Hook — returns { enabled, reason }
const { enabled, reason } = useFeature('live-chat');

// Component — declarative gate
<Feature name="live-chat" fallback={<UpgradeBanner />}>
  <ChatWidget />
</Feature>

// Render prop — always renders, gives you the state
<FeatureToggle name="live-chat">
  {({ enabled, reason }) => (
    <div>{enabled ? 'Chat active' : reason}</div>
  )}
</FeatureToggle>`} language="tsx" />
      </Section>
    </div>
  );
}

function FeatureRow({ name }: { name: string }) {
  const { enabled, reason } = useFeature(name);
  return (
    <div className="flex items-center justify-between border-b border-zinc-50 py-1.5 last:border-b-0 dark:border-zinc-800/50">
      <div className="flex items-center gap-2">
        <code className="text-[12px] text-zinc-700 dark:text-zinc-300">{name}</code>
        <span className="text-[11px] text-zinc-400">({reason})</span>
      </div>
      <Pill active={enabled}>{enabled ? 'ON' : 'OFF'}</Pill>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 4 — Experiments
   Shows: useExperiment(), <Experiment>
   ═══════════════════════════════════════════ */

function ExperimentsTab() {
  return (
    <div className="space-y-4">
      <Section title="Assignments" hook="useExperiment()">
        <ExpRow id="checkout-layout" />
        <ExpRow id="promo-banner" />
      </Section>

      <Section title="Promo Banner" hook="<Experiment>">
        <p className="mb-2 text-[12px] text-zinc-400">The Experiment component renders the assigned variant automatically</p>
        <Experiment
          id="promo-banner"
          variants={{
            seasonal: <div className="rounded-md bg-zinc-900 p-3 text-center text-[13px] font-medium text-white dark:bg-zinc-800">🌨️ Winter Sale — 50% off everything</div>,
            loyalty:  <div className="rounded-md bg-zinc-900 p-3 text-center text-[13px] font-medium text-white dark:bg-zinc-800">⭐ Double Points Week — Earn 2x</div>,
            referral: <div className="rounded-md bg-zinc-900 p-3 text-center text-[13px] font-medium text-white dark:bg-zinc-800">🎁 Refer &amp; Save — Give $10, Get $10</div>,
          }}
        />
      </Section>

      <Section title="Checkout Layout" hook="useExperiment()">
        <CheckoutPreview />
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { useExperiment, Experiment } from 'react-access-engine';

// Hook — returns { variant, active }
const { variant, active } = useExperiment('checkout-layout');

// Component — renders the assigned variant
<Experiment
  id="promo-banner"
  variants={{
    seasonal: <WinterBanner />,
    loyalty:  <PointsBanner />,
    referral: <ReferralBanner />,
  }}
  fallback={<DefaultBanner />}
/>`} language="tsx" />
      </Section>
    </div>
  );
}

function ExpRow({ id }: { id: string }) {
  const { variant, active } = useExperiment(id);
  return (
    <div className="flex items-center justify-between border-b border-zinc-50 py-1.5 last:border-b-0 dark:border-zinc-800/50">
      <code className="text-[12px] text-zinc-700 dark:text-zinc-300">{id}</code>
      <div className="flex gap-1.5">
        <Pill active={active}>{active ? 'active' : 'off'}</Pill>
        <Pill active>{variant}</Pill>
      </div>
    </div>
  );
}

function CheckoutPreview() {
  const { variant } = useExperiment('checkout-layout');
  const layouts: Record<string, { label: string; desc: string }> = {
    classic:       { label: 'Classic', desc: 'Traditional multi-section layout' },
    'one-page':    { label: 'One-Page', desc: 'Everything on a single scrollable page' },
    'step-wizard': { label: 'Step Wizard', desc: 'Guided step-by-step process' },
  };
  const l = layouts[variant] ?? layouts['classic']!;
  return (
    <Result ok>
      <strong>{l!.label}</strong>
      <span className="ml-2 text-[12px] opacity-70">variant: {variant} — {l!.desc}</span>
    </Result>
  );
}

/* ═══════════════════════════════════════════
   Tab 5 — Policies (ABAC)
   Shows: usePolicy()
   ═══════════════════════════════════════════ */

function PoliciesTab() {
  const ownProduct = usePolicy('products:edit', { sellerId: 'seller-001' });
  const otherProduct = usePolicy('products:edit', { sellerId: 'someone-else' });
  const recentOrder = usePolicy('orders:refund', { orderedAt: Date.now() - 5 * 86400000 });
  const oldOrder = usePolicy('orders:refund', { orderedAt: Date.now() - 60 * 86400000 });

  return (
    <div className="space-y-4">
      <Section title="Seller Product Ownership" hook="usePolicy()">
        <p className="mb-2 text-[12px] text-zinc-400">Policy: Sellers can only edit/delete their own products</p>
        <Result ok={ownProduct.allowed}>
          products:edit own product (sellerId matches)
          <span className="ml-auto text-[11px] opacity-60">{ownProduct.reason}</span>
        </Result>
        <Result ok={otherProduct.allowed}>
          products:edit another seller&apos;s product
          <span className="ml-auto text-[11px] opacity-60">{otherProduct.reason}</span>
        </Result>
      </Section>

      <Section title="Refund Time Limit" hook="usePolicy()">
        <p className="mb-2 text-[12px] text-zinc-400">Policy: Block refunds after 30 days</p>
        <Result ok={recentOrder.allowed}>
          orders:refund — 5-day-old order
          <span className="ml-auto text-[11px] opacity-60">{recentOrder.reason}</span>
        </Result>
        <Result ok={oldOrder.allowed}>
          orders:refund — 60-day-old order
          <span className="ml-auto text-[11px] opacity-60">{oldOrder.reason}</span>
        </Result>
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { usePolicy } from 'react-access-engine';

// Returns { allowed, reason, matchedRule }
const { allowed, reason } = usePolicy('products:edit', {
  sellerId: 'seller-001',
});

// In config:
const config = defineAccess({
  policies: [{
    id: 'seller-own-products',
    effect: 'allow',
    permissions: ['products:edit'],
    condition: ({ user, resource }) =>
      user.id === resource.sellerId,
    description: 'Sellers can only edit/delete their own products',
  }],
});`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 6 — Gate Components
   Shows: <Allow>, <Can>, <AccessGate>, <PermissionGuard>
   ═══════════════════════════════════════════ */

function GatesTab() {
  return (
    <div className="space-y-4">
      <Section title="<Allow> — Unified Gate" hook="<Allow>">
        <p className="mb-2 text-[12px] text-zinc-400">Permission, role, feature, and plan checks in one component</p>
        <Allow permission="cart:manage" fallback={<Result ok={false}>permission=&quot;cart:manage&quot;</Result>}><Result ok>permission=&quot;cart:manage&quot;</Result></Allow>
        <Allow role="seller" fallback={<Result ok={false}>role=&quot;seller&quot;</Result>}><Result ok>role=&quot;seller&quot;</Result></Allow>
        <Allow feature="ai-recommendations" fallback={<Result ok={false}>feature=&quot;ai-recommendations&quot;</Result>}><Result ok>feature=&quot;ai-recommendations&quot;</Result></Allow>
        <Allow plan="plus" fallback={<Result ok={false}>plan=&quot;plus&quot;</Result>}><Result ok>plan=&quot;plus&quot;</Result></Allow>

        <p className="mt-3 mb-2 text-[12px] text-zinc-400">Multiple conditions with match=&quot;all&quot; (default) vs match=&quot;any&quot;</p>
        <Allow permission="cart:manage" role="seller" match="all" fallback={<Result ok={false}>permission + role (match=&quot;all&quot;)</Result>}>
          <Result ok>permission=&quot;cart:manage&quot; + role=&quot;seller&quot; (match=&quot;all&quot;)</Result>
        </Allow>
        <Allow permission="cart:manage" role="seller" match="any" fallback={<Result ok={false}>permission OR role (match=&quot;any&quot;)</Result>}>
          <Result ok>permission=&quot;cart:manage&quot; OR role=&quot;seller&quot; (match=&quot;any&quot;)</Result>
        </Allow>
      </Section>

      <Section title="<Can> — Permission Gate" hook="<Can>">
        <p className="mb-2 text-[12px] text-zinc-400">Fine-grained permission checks with perform, permissions, on, policy, mode</p>
        <Can perform="inventory:manage" fallback={<Result ok={false}>perform=&quot;inventory:manage&quot;</Result>}>
          <Result ok>perform=&quot;inventory:manage&quot;</Result>
        </Can>
        <Can permissions={['orders:view-all', 'orders:refund']} mode="all" fallback={<Result ok={false}>permissions=[orders:view-all, orders:refund] mode=&quot;all&quot;</Result>}>
          <Result ok>permissions=[orders:view-all, orders:refund] mode=&quot;all&quot;</Result>
        </Can>
        <Can perform="analytics:own-store" role="seller" fallback={<Result ok={false}>perform + role combined</Result>}>
          <Result ok>perform=&quot;analytics:own-store&quot; + role=&quot;seller&quot;</Result>
        </Can>
      </Section>

      <Section title="<AccessGate> — Multi-Condition" hook="<AccessGate>">
        <p className="mb-2 text-[12px] text-zinc-400">Combines permission + feature + roles + plan in one gate</p>
        <AccessGate permission="products:browse" feature="wishlist" fallback={<Result ok={false}>permission + feature (mode=&quot;all&quot;)</Result>}>
          <Result ok>permission=&quot;products:browse&quot; + feature=&quot;wishlist&quot;</Result>
        </AccessGate>
        <AccessGate roles={['admin', 'support']} plan="plus" mode="any" fallback={<Result ok={false}>roles=[admin, support] OR plan=&quot;plus&quot; (mode=&quot;any&quot;)</Result>}>
          <Result ok>roles=[admin, support] OR plan=&quot;plus&quot; (mode=&quot;any&quot;)</Result>
        </AccessGate>
      </Section>

      <Section title="<PermissionGuard> — Route Guard" hook="<PermissionGuard>">
        <p className="mb-2 text-[12px] text-zinc-400">Requires ALL specified permissions — designed for route protection</p>
        <PermissionGuard permissions={['products:browse']} fallback={<Result ok={false}>Guard: products:browse</Result>}>
          <Result ok>Guard: products:browse — Access granted</Result>
        </PermissionGuard>
        <PermissionGuard permissions={['inventory:manage', 'analytics:own-store']} fallback={<Result ok={false}>Guard: inventory:manage + analytics:own-store</Result>}>
          <Result ok>Guard: inventory:manage + analytics:own-store — Access granted</Result>
        </PermissionGuard>
        <PermissionGuard permissions={['orders:view-all', 'tickets:manage']} fallback={<Result ok={false}>Guard: orders:view-all + tickets:manage</Result>}>
          <Result ok>Guard: orders:view-all + tickets:manage — Access granted</Result>
        </PermissionGuard>
      </Section>

      <Section title="Nested Gates" hook="<Allow> + <Can> + <Feature>">
        <p className="mb-2 text-[12px] text-zinc-400">Compose gates to build complex UI trees</p>
        <Allow role="seller" fallback={<Result ok={false}>Not a seller — entire dashboard hidden</Result>}>
          <Can perform="inventory:manage" fallback={<Result ok={false}>inventory:manage</Result>}><Result ok>Inventory Manager</Result></Can>
          <Can perform="analytics:own-store" fallback={<Result ok={false}>analytics:own-store</Result>}><Result ok>Store Analytics</Result></Can>
          <Can perform="coupons:create" fallback={<Result ok={false}>coupons:create</Result>}><Result ok>Create Coupons</Result></Can>
          <Feature name="bulk-discount" fallback={<Result ok={false}>bulk-discount</Result>}><Result ok>Bulk Discount Pricing</Result></Feature>
        </Allow>
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { Allow, Can, AccessGate, PermissionGuard } from 'react-access-engine';

// <Allow> — unified, most flexible
<Allow permission="cart:manage" role="customer" match="all">
  <CartPage />
</Allow>

// <Can> — fine-grained permission gate
<Can perform="products:edit" on={{ sellerId: user.id }}>
  <EditButton />
</Can>

// <AccessGate> — multi-condition gate
<AccessGate permission="analytics:view" plan="plus" mode="all">
  <AnalyticsDashboard />
</AccessGate>

// <PermissionGuard> — route-level guard (ALL permissions required)
<PermissionGuard
  permissions={['orders:view-all', 'orders:refund']}
  fallback={<Navigate to="/403" />}
>
  <AdminOrdersPage />
</PermissionGuard>`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 7 — Plans
   Shows: usePlan(), tier(), <Allow plan>
   ═══════════════════════════════════════════ */

function PlansTab() {
  const { plan, hasPlanAccess } = usePlan();
  const { tier } = useAccess();

  const planFeatures: Record<string, string[]> = {
    free:    ['Browse products', 'Add to cart', 'Write reviews'],
    plus:    ['Live chat support', 'Loyalty points', 'Priority shipping'],
    premium: ['AI recommendations', 'Early access to sales', 'Exclusive deals'],
  };

  return (
    <div className="space-y-4">
      <Section title="Current Plan" hook="usePlan()">
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-zinc-600 dark:text-zinc-300">
            Active plan: <strong className="text-zinc-900 dark:text-white">{plan ?? 'none'}</strong>
          </div>
        </div>
      </Section>

      <Section title="Plan Tier Comparison" hook="hasPlanAccess() + tier()">
        <p className="mb-2 text-[12px] text-zinc-400">Plans are ordered: free → plus → premium. hasPlanAccess checks if user&apos;s plan meets or exceeds the required tier.</p>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Required Plan</th>
                <th className="px-3 py-2 text-center font-medium text-zinc-500 dark:text-zinc-400">hasPlanAccess()</th>
                <th className="px-3 py-2 text-center font-medium text-zinc-500 dark:text-zinc-400">tier()</th>
              </tr>
            </thead>
            <tbody>
              {['free', 'plus', 'premium'].map(p => (
                <tr key={p} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
                  <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{p}</td>
                  <td className="px-3 py-2 text-center"><Pill active={hasPlanAccess(p)}>{hasPlanAccess(p) ? '✓' : '✗'}</Pill></td>
                  <td className="px-3 py-2 text-center"><Pill active={tier(p)}>{tier(p) ? '✓' : '✗'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Plan-Gated Features" hook="<Allow plan>">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(planFeatures).map(([planName, features]) => (
            <div key={planName} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold capitalize text-zinc-900 dark:text-white">{planName}</span>
                  <Pill active={hasPlanAccess(planName)}>{hasPlanAccess(planName) ? 'Active' : 'Locked'}</Pill>
                </div>
              </div>
              <div className="p-3">
                {features.map(f => (
                  <div key={f} className="flex items-center gap-2 py-1 text-[12px]">
                    <span className={hasPlanAccess(planName) ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'}>
                      {hasPlanAccess(planName) ? '✓' : '○'}
                    </span>
                    <span className={hasPlanAccess(planName) ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { usePlan, useAccess, Allow } from 'react-access-engine';

// usePlan() — plan tier checking
const { plan, hasPlanAccess } = usePlan();
plan;                    // 'free' | 'plus' | 'premium'
hasPlanAccess('plus');   // true if user plan >= plus

// useAccess() — shorthand tier check
const { tier } = useAccess();
tier('premium');         // boolean

// Declarative — plan gate component
<Allow plan="plus" fallback={<UpgradeBanner />}>
  <PremiumContent />
</Allow>`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 8 — Debug
   Shows: useAccessDebug()
   ═══════════════════════════════════════════ */

function DebugTab() {
  const debug = useAccessDebug();
  const [, refresh] = useState(0);

  return (
    <div className="space-y-4">
      <Section title="Trace Output" hook="useAccessDebug()">
        <div className="rounded-md bg-zinc-950 p-4 font-mono text-[12px] leading-relaxed text-zinc-300">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-zinc-500">
              Checks: {debug.lastChecks.length} | Features: {debug.lastFeatureEvals.length} | Policies: {debug.lastPolicyEvals.length}
            </span>
            <button
              onClick={() => refresh(t => t + 1)}
              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-700"
            >
              Refresh
            </button>
          </div>
          {debug.lastChecks.length === 0 && debug.lastFeatureEvals.length === 0 && debug.lastPolicyEvals.length === 0 && (
            <div className="text-zinc-600">No checks recorded yet. Interact with the other tabs first.</div>
          )}
          {debug.lastChecks.slice(-8).map((c, i) => (
            <div key={`c-${i}`} className={c.granted ? 'text-emerald-400' : 'text-red-400'}>
              [{c.granted ? 'ALLOW' : 'DENY'}] {c.permission} — {c.reason ?? 'n/a'}
            </div>
          ))}
          {debug.lastFeatureEvals.slice(-6).map((f, i) => (
            <div key={`f-${i}`} className={f.enabled ? 'text-emerald-400' : 'text-amber-400'}>
              [FEATURE] {f.feature} → {f.enabled ? 'ON' : 'OFF'} ({f.reason})
            </div>
          ))}
          {debug.lastPolicyEvals.slice(-4).map((p, i) => (
            <div key={`p-${i}`} className={p.effect === 'allow' ? 'text-emerald-400' : 'text-red-400'}>
              [POLICY] {p.permission} → {p.effect.toUpperCase()} (rule: {p.matchedRule ?? 'none'})
            </div>
          ))}
        </div>
      </Section>

      <Section title="Config Snapshot" hook="configSnapshot">
        <div className="rounded-md bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-400 max-h-64 overflow-y-auto">
          <pre>{JSON.stringify(debug.configSnapshot, null, 2)}</pre>
        </div>
      </Section>

      <Section title="Usage">
        <CodeBlock code={`import { useAccessDebug } from 'react-access-engine';

const {
  lastChecks,        // AccessCheckEvent[]
  lastFeatureEvals,  // FeatureEvaluateEvent[]
  lastPolicyEvals,   // PolicyEvaluateEvent[]
  configSnapshot,    // current config object
} = useAccessDebug();

// Each check: { permission, granted, reason, roles, timestamp }
// Each feature eval: { feature, enabled, reason, timestamp }
// Each policy eval: { permission, effect, matchedRule, timestamp }`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab 9 — Config
   Shows: defineAccess(), AccessProvider
   ═══════════════════════════════════════════ */

function ConfigTab() {
  return (
    <div className="space-y-4">
      <Section title="Full Config" hook="defineAccess()">
        <p className="mb-2 text-[12px] text-zinc-400">This is the exact config powering this playground — passed to AccessProvider</p>
        <CodeBlock code={`import { defineAccess } from 'react-access-engine';

const config = defineAccess({
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own',
               'reviews:write', 'wishlist:manage'],
    seller:   ['products:browse', 'products:create',
               'products:edit-own', 'inventory:manage',
               'analytics:own-store', 'coupons:create'],
    admin:    ['*'],
    support:  ['products:browse', 'orders:view-all',
               'orders:refund', 'reviews:moderate',
               'tickets:manage'],
  },
  plans: ['free', 'plus', 'premium'],
  features: {
    'quick-buy':          true,
    'wishlist':           true,
    'ai-recommendations': { enabled: true, allowedPlans: ['premium'] },
    'live-chat':          { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points':     { enabled: true, allowedPlans: ['plus', 'premium'] },
    'bulk-discount':      { enabled: true, allowedRoles: ['seller'] },
    'flash-sale':         true,
  },
  experiments: {
    'checkout-layout': {
      id: 'checkout-layout',
      variants: ['classic', 'one-page', 'step-wizard'],
      defaultVariant: 'classic',
      active: true,
      allocation: { classic: 34, 'one-page': 33, 'step-wizard': 33 },
    },
  },
  policies: [{
    id: 'seller-own-products',
    effect: 'allow',
    permissions: ['products:edit'],
    condition: ({ user, resource }) =>
      user.id === resource.sellerId,
  }],
  debug: true,
});`} language="tsx" />
      </Section>

      <Section title="Provider Setup" hook="<AccessProvider>">
        <CodeBlock code={`import { AccessProvider } from 'react-access-engine';

function App() {
  const user = {
    id: 'user-123',
    roles: ['customer'],
    plan: 'plus',
  };

  return (
    <AccessProvider config={config} user={user}>
      <YourApp />
    </AccessProvider>
  );
}`} language="tsx" />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

type Tab = 'store' | 'rbac' | 'features' | 'experiments' | 'policies' | 'gates' | 'plans' | 'debug' | 'config';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'store',       label: 'Store Preview' },
  { id: 'rbac',        label: 'RBAC' },
  { id: 'features',    label: 'Features' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'policies',    label: 'Policies' },
  { id: 'gates',       label: 'Gates' },
  { id: 'plans',       label: 'Plans' },
  { id: 'debug',       label: 'Debug' },
  { id: 'config',      label: 'Config' },
];

export default function PlaygroundPage() {
  const [userKey, setUserKey] = useState<UserKey>('customer');
  const [tab, setTab] = useState<Tab>('store');
  const currentUser = useMemo(() => users[userKey], [userKey]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Playground
        </h1>
        <p className="mt-1.5 text-[14px] text-zinc-500 dark:text-zinc-400">
          Interactive e-commerce demo. Switch users to explore RBAC, feature flags, experiments, ABAC policies, plan gating, and gate components — all powered by react-access-engine.
        </p>
      </div>

      {/* User Picker */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-medium uppercase tracking-wider text-zinc-400">User</span>
          {(Object.keys(users) as UserKey[]).map(key => {
            const u = users[key];
            return (
              <button
                key={key}
                onClick={() => setUserKey(key)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors',
                  userKey === key
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600'
                )}
              >
                {u.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-zinc-400">
          <Pill active>{currentUser.roles[0]}</Pill>
          <Pill active>{currentUser.plan} plan</Pill>
          <span className="ml-1">{currentUser.desc}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-0 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AccessProvider config={storeConfig} user={currentUser}>
        {tab === 'store' && <StoreTab />}
        {tab === 'rbac' && <RBACTab />}
        {tab === 'features' && <FeaturesTab />}
        {tab === 'experiments' && <ExperimentsTab />}
        {tab === 'policies' && <PoliciesTab />}
        {tab === 'gates' && <GatesTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'debug' && <DebugTab />}
        {tab === 'config' && <ConfigTab />}
      </AccessProvider>
    </div>
  );
}
