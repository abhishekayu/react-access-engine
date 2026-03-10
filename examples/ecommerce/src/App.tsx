import React, { useState } from 'react';
import {
  defineAccess,
  AccessProvider,
  Allow,
  Can,
  Feature,
  Experiment,
  useAccess,
  usePlan,
  useFeature,
  useExperiment,
} from 'react-access-engine';

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEFINE YOUR ACCESS CONFIG
//    This is the single source of truth for your entire e-commerce store.
// ─────────────────────────────────────────────────────────────────────────────
const config = defineAccess({
  // Who can do what
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: [
      'products:browse',
      'cart:manage',
      'orders:own',
      'reviews:write',
      'wishlist:manage',
      'profile:edit',
    ],
    seller: [
      'products:browse',
      'products:create',
      'products:edit-own',
      'orders:own',
      'orders:seller-view',
      'inventory:manage',
      'analytics:own-store',
      'profile:edit',
      'coupons:create',
    ],
    admin: ['*'], // Full access
    support: [
      'products:browse',
      'orders:view-all',
      'orders:refund',
      'customers:view',
      'reviews:moderate',
      'tickets:manage',
    ],
  },

  // Subscription tiers
  plans: ['free', 'plus', 'premium'],

  // Feature flags — toggle features without redeploying
  features: {
    'quick-buy':        true,                                          // Buy-now button
    'wishlist':         true,                                          // Wishlist feature
    'reviews-v2':       { rolloutPercentage: 50 },                     // New review UI (50% rollout)
    'ai-recommendations': { enabled: true, allowedPlans: ['premium'] }, // AI-powered suggestions
    'bulk-discount':    { enabled: true, allowedRoles: ['seller'] },    // Seller bulk pricing
    'live-chat':        { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points':   { enabled: true, allowedPlans: ['plus', 'premium'] },
  },

  // A/B test different checkout experiences
  experiments: {
    'checkout-layout': {
      id: 'checkout-layout',
      variants: ['classic', 'one-page', 'step-wizard'],
      defaultVariant: 'classic',
      active: true,
      allocation: { classic: 34, 'one-page': 33, 'step-wizard': 33 },
    },
    'product-card-style': {
      id: 'product-card-style',
      variants: ['grid', 'list'],
      defaultVariant: 'grid',
      active: true,
      allocation: { grid: 50, list: 50 },
    },
  },

  debug: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SIMULATE DIFFERENT USER TYPES
// ─────────────────────────────────────────────────────────────────────────────
const users = {
  customer: { id: 'cust-001', roles: ['customer'] as string[], plan: 'free' as string },
  plusCustomer: { id: 'cust-002', roles: ['customer'] as string[], plan: 'plus' as string },
  premiumCustomer: { id: 'cust-003', roles: ['customer'] as string[], plan: 'premium' as string },
  seller: { id: 'seller-001', roles: ['seller'] as string[], plan: 'plus' as string },
  admin: { id: 'admin-001', roles: ['admin'] as string[], plan: 'premium' as string },
  support: { id: 'support-001', roles: ['support'] as string[], plan: 'free' as string },
};

type UserKey = keyof typeof users;

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPONENTS — See how easy it is to protect everything
// ─────────────────────────────────────────────────────────────────────────────

const box = {
  padding: 16,
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  marginBottom: 12,
} as const;

// --- Product Card ---
function ProductCard({ name, price }: { name: string; price: number }) {
  const { can, has } = useAccess();

  return (
    <div style={{ ...box, background: '#fff' }}>
      <h4 style={{ margin: '0 0 8px' }}>{name}</h4>
      <p style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 'bold' }}>${price}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Allow permission="cart:manage">
          <button style={btnStyle}>🛒 Add to Cart</button>
        </Allow>

        {has('quick-buy') && can('cart:manage') && (
          <button style={{ ...btnStyle, background: '#ff9800', color: '#fff' }}>⚡ Buy Now</button>
        )}

        <Feature name="wishlist">
          <button style={{ ...btnStyle, background: 'transparent', border: '1px solid #e91e63' }}>
            ❤️ Wishlist
          </button>
        </Feature>
      </div>
    </div>
  );
}

// --- AI Recommendations (Premium only) ---
function AIRecommendations() {
  return (
    <Allow feature="ai-recommendations" fallback={
      <div style={{ ...box, background: '#fff3e0', textAlign: 'center' }}>
        <p>🤖 <strong>AI Recommendations</strong> — Upgrade to Premium</p>
        <button style={{ ...btnStyle, background: '#ff9800', color: '#fff' }}>Upgrade Now</button>
      </div>
    }>
      <div style={{ ...box, background: '#e8f5e9' }}>
        <h4 style={{ margin: '0 0 8px' }}>🤖 AI Picks For You</h4>
        <p style={{ margin: 0 }}>Based on your browsing: Wireless Earbuds, Phone Case, USB-C Cable</p>
      </div>
    </Allow>
  );
}

// --- Loyalty Points (Plus/Premium) ---
function LoyaltyBadge() {
  return (
    <Feature name="loyalty-points" fallback={null}>
      <div style={{ ...box, background: '#fce4ec' }}>
        ⭐ <strong>340 Loyalty Points</strong> — Redeem at checkout!
      </div>
    </Feature>
  );
}

// --- Live Chat (Plus/Premium) ---
function LiveChat() {
  return (
    <Allow feature="live-chat" fallback={
      <div style={{ ...box, background: '#f5f5f5', textAlign: 'center' }}>
        💬 Live Chat available on <strong>Plus</strong> plan
      </div>
    }>
      <div style={{ ...box, background: '#e3f2fd' }}>
        💬 <strong>Live Chat</strong> — Support agent available
      </div>
    </Allow>
  );
}

// --- Seller Dashboard ---
function SellerDashboard() {
  return (
    <Allow role="seller" fallback={null}>
      <div style={{ ...box, background: '#fff8e1' }}>
        <h3 style={{ margin: '0 0 8px' }}>📦 Seller Dashboard</h3>

        <Can perform="inventory:manage">
          <p>✅ Manage inventory (23 products listed)</p>
        </Can>

        <Can perform="analytics:own-store">
          <p>✅ Store analytics: 1,240 views this week</p>
        </Can>

        <Can perform="coupons:create">
          <p>✅ Create discount coupons</p>
        </Can>

        <Feature name="bulk-discount">
          <p>✅ Bulk discount pricing enabled</p>
        </Feature>
      </div>
    </Allow>
  );
}

// --- Admin Panel ---
function AdminPanel() {
  return (
    <Allow role="admin" fallback={null}>
      <div style={{ ...box, background: '#fce4ec' }}>
        <h3 style={{ margin: '0 0 8px' }}>🛡️ Admin Panel</h3>
        <p>Users: 12,482 | Orders today: 847 | Revenue: $42,300</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle}>Manage Users</button>
          <button style={btnStyle}>Manage Products</button>
          <button style={btnStyle}>View Reports</button>
        </div>
      </div>
    </Allow>
  );
}

// --- Support Tools ---
function SupportTools() {
  return (
    <Allow role="support" fallback={null}>
      <div style={{ ...box, background: '#e8eaf6' }}>
        <h3 style={{ margin: '0 0 8px' }}>🎧 Support Tools</h3>

        <Can perform="orders:view-all">
          <p>✅ Search & view all orders</p>
        </Can>

        <Can perform="orders:refund">
          <p>✅ Process refunds</p>
        </Can>

        <Can perform="reviews:moderate">
          <p>✅ Moderate reviews</p>
        </Can>

        <Can perform="tickets:manage">
          <p>✅ Manage support tickets (14 open)</p>
        </Can>
      </div>
    </Allow>
  );
}

// --- Checkout A/B Test ---
function CheckoutPreview() {
  const { variant } = useExperiment('checkout-layout');

  const layouts: Record<string, { label: string; desc: string }> = {
    classic:       { label: '📋 Classic Checkout', desc: 'Multi-page: Shipping → Payment → Review → Confirm' },
    'one-page':    { label: '📄 One-Page Checkout', desc: 'Everything on a single scrollable page' },
    'step-wizard': { label: '🧙 Step Wizard', desc: 'Guided wizard with progress bar' },
  };

  const layout = layouts[variant] ?? layouts['classic']!;

  return (
    <div style={{ ...box, background: '#f3e5f5' }}>
      <h4 style={{ margin: '0 0 4px' }}>{layout.label}</h4>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>
        A/B Test: you&apos;re seeing variant <strong>&quot;{variant}&quot;</strong>
      </p>
      <p style={{ margin: 0 }}>{layout.desc}</p>
    </div>
  );
}

// --- Reviews A/B Test ---
function ReviewSection() {
  const { enabled } = useFeature('reviews-v2');

  return (
    <div style={{ ...box, background: enabled ? '#e0f7fa' : '#f5f5f5' }}>
      <h4 style={{ margin: '0 0 4px' }}>
        {enabled ? '⭐ Reviews (New UI — v2)' : '⭐ Reviews (Classic)'}
      </h4>
      <p style={{ margin: 0 }}>
        {enabled
          ? 'Rich media reviews with photos, verified badges, and helpful votes'
          : 'Text-based reviews with star ratings'}
      </p>
      <Allow permission="reviews:write">
        <button style={{ ...btnStyle, marginTop: 8 }}>Write a Review</button>
      </Allow>
    </div>
  );
}

// --- Plan Overview ---
function PlanOverview() {
  const { plan, hasPlanAccess } = usePlan();

  return (
    <div style={{ ...box, background: '#e8f5e9' }}>
      <h4 style={{ margin: '0 0 8px' }}>Your Plan: <strong>{plan ?? 'free'}</strong></h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={thStyle}>Feature</th>
            <th style={thStyle}>Free</th>
            <th style={thStyle}>Plus</th>
            <th style={thStyle}>Premium</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Basic shopping', 'free'],
            ['Live chat support', 'plus'],
            ['Loyalty points', 'plus'],
            ['AI recommendations', 'premium'],
          ].map(([feature, minPlan]) => (
            <tr key={feature}>
              <td style={tdStyle}>{feature}</td>
              {(['free', 'plus', 'premium'] as const).map((p) => (
                <td key={p} style={{ ...tdStyle, textAlign: 'center' }}>
                  {['free', 'plus', 'premium'].indexOf(p) >= ['free', 'plus', 'premium'].indexOf(minPlan!)
                    ? hasPlanAccess(p) ? '✅' : '🔒'
                    : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export function App() {
  const [userKey, setUserKey] = useState<UserKey>('customer');
  const currentUser = users[userKey];

  return (
    <AccessProvider config={config} user={currentUser}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
        <h1 style={{ margin: '0 0 4px' }}>🛍️ ShopEngine</h1>
        <p style={{ margin: '0 0 16px', color: '#666' }}>
          E-commerce demo powered by <code>react-access-engine</code>
        </p>

        {/* User Switcher */}
        <div style={{ ...box, background: '#f5f5f5' }}>
          <strong>Switch user:</strong>{' '}
          <select
            value={userKey}
            onChange={(e) => setUserKey(e.target.value as UserKey)}
            style={{ padding: '4px 8px', fontSize: 14 }}
          >
            <option value="customer">Customer (Free)</option>
            <option value="plusCustomer">Customer (Plus)</option>
            <option value="premiumCustomer">Customer (Premium)</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
            <option value="support">Support Agent</option>
          </select>
          <UserBadge />
        </div>

        {/* Plan overview */}
        <PlanOverview />

        {/* Products */}
        <h2>Products</h2>
        <ProductCard name="Wireless Headphones" price={79.99} />
        <ProductCard name="Mechanical Keyboard" price={149.99} />

        {/* AI Recs & Loyalty */}
        <AIRecommendations />
        <LoyaltyBadge />

        {/* Reviews */}
        <ReviewSection />

        {/* Checkout A/B */}
        <h2>Checkout Experience</h2>
        <CheckoutPreview />

        {/* Live Chat */}
        <LiveChat />

        {/* Role-specific panels */}
        <SellerDashboard />
        <AdminPanel />
        <SupportTools />
      </div>
    </AccessProvider>
  );
}

// --- Small helper components ---
function UserBadge() {
  const { user, roles, permissions } = useAccess();
  return (
    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555' }}>
      ID: <code>{user.id}</code> · Roles: <strong>{roles.join(', ')}</strong> · {permissions.length} permissions
    </p>
  );
}

// --- Styles ---
const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 6,
  border: '1px solid #ccc',
  background: '#f5f5f5',
  cursor: 'pointer',
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: '2px solid #ccc',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #eee',
};
