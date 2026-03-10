import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { defineAccess, AccessProvider, Allow, Can, Feature, useAccess, usePlan, useFeature, useExperiment, } from 'react-access-engine';
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
        'quick-buy': true, // Buy-now button
        'wishlist': true, // Wishlist feature
        'reviews-v2': { rolloutPercentage: 50 }, // New review UI (50% rollout)
        'ai-recommendations': { enabled: true, allowedPlans: ['premium'] }, // AI-powered suggestions
        'bulk-discount': { enabled: true, allowedRoles: ['seller'] }, // Seller bulk pricing
        'live-chat': { enabled: true, allowedPlans: ['plus', 'premium'] },
        'loyalty-points': { enabled: true, allowedPlans: ['plus', 'premium'] },
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
    customer: { id: 'cust-001', roles: ['customer'], plan: 'free' },
    plusCustomer: { id: 'cust-002', roles: ['customer'], plan: 'plus' },
    premiumCustomer: { id: 'cust-003', roles: ['customer'], plan: 'premium' },
    seller: { id: 'seller-001', roles: ['seller'], plan: 'plus' },
    admin: { id: 'admin-001', roles: ['admin'], plan: 'premium' },
    support: { id: 'support-001', roles: ['support'], plan: 'free' },
};
// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPONENTS — See how easy it is to protect everything
// ─────────────────────────────────────────────────────────────────────────────
const box = {
    padding: 16,
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    marginBottom: 12,
};
// --- Product Card ---
function ProductCard({ name, price }) {
    const { can, has } = useAccess();
    return (_jsxs("div", { style: { ...box, background: '#fff' }, children: [_jsx("h4", { style: { margin: '0 0 8px' }, children: name }), _jsxs("p", { style: { margin: '0 0 8px', fontSize: 20, fontWeight: 'bold' }, children: ["$", price] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx(Allow, { permission: "cart:manage", children: _jsx("button", { style: btnStyle, children: "\uD83D\uDED2 Add to Cart" }) }), has('quick-buy') && can('cart:manage') && (_jsx("button", { style: { ...btnStyle, background: '#ff9800', color: '#fff' }, children: "\u26A1 Buy Now" })), _jsx(Feature, { name: "wishlist", children: _jsx("button", { style: { ...btnStyle, background: 'transparent', border: '1px solid #e91e63' }, children: "\u2764\uFE0F Wishlist" }) })] })] }));
}
// --- AI Recommendations (Premium only) ---
function AIRecommendations() {
    return (_jsx(Allow, { feature: "ai-recommendations", fallback: _jsxs("div", { style: { ...box, background: '#fff3e0', textAlign: 'center' }, children: [_jsxs("p", { children: ["\uD83E\uDD16 ", _jsx("strong", { children: "AI Recommendations" }), " \u2014 Upgrade to Premium"] }), _jsx("button", { style: { ...btnStyle, background: '#ff9800', color: '#fff' }, children: "Upgrade Now" })] }), children: _jsxs("div", { style: { ...box, background: '#e8f5e9' }, children: [_jsx("h4", { style: { margin: '0 0 8px' }, children: "\uD83E\uDD16 AI Picks For You" }), _jsx("p", { style: { margin: 0 }, children: "Based on your browsing: Wireless Earbuds, Phone Case, USB-C Cable" })] }) }));
}
// --- Loyalty Points (Plus/Premium) ---
function LoyaltyBadge() {
    return (_jsx(Feature, { name: "loyalty-points", fallback: null, children: _jsxs("div", { style: { ...box, background: '#fce4ec' }, children: ["\u2B50 ", _jsx("strong", { children: "340 Loyalty Points" }), " \u2014 Redeem at checkout!"] }) }));
}
// --- Live Chat (Plus/Premium) ---
function LiveChat() {
    return (_jsx(Allow, { feature: "live-chat", fallback: _jsxs("div", { style: { ...box, background: '#f5f5f5', textAlign: 'center' }, children: ["\uD83D\uDCAC Live Chat available on ", _jsx("strong", { children: "Plus" }), " plan"] }), children: _jsxs("div", { style: { ...box, background: '#e3f2fd' }, children: ["\uD83D\uDCAC ", _jsx("strong", { children: "Live Chat" }), " \u2014 Support agent available"] }) }));
}
// --- Seller Dashboard ---
function SellerDashboard() {
    return (_jsx(Allow, { role: "seller", fallback: null, children: _jsxs("div", { style: { ...box, background: '#fff8e1' }, children: [_jsx("h3", { style: { margin: '0 0 8px' }, children: "\uD83D\uDCE6 Seller Dashboard" }), _jsx(Can, { perform: "inventory:manage", children: _jsx("p", { children: "\u2705 Manage inventory (23 products listed)" }) }), _jsx(Can, { perform: "analytics:own-store", children: _jsx("p", { children: "\u2705 Store analytics: 1,240 views this week" }) }), _jsx(Can, { perform: "coupons:create", children: _jsx("p", { children: "\u2705 Create discount coupons" }) }), _jsx(Feature, { name: "bulk-discount", children: _jsx("p", { children: "\u2705 Bulk discount pricing enabled" }) })] }) }));
}
// --- Admin Panel ---
function AdminPanel() {
    return (_jsx(Allow, { role: "admin", fallback: null, children: _jsxs("div", { style: { ...box, background: '#fce4ec' }, children: [_jsx("h3", { style: { margin: '0 0 8px' }, children: "\uD83D\uDEE1\uFE0F Admin Panel" }), _jsx("p", { children: "Users: 12,482 | Orders today: 847 | Revenue: $42,300" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { style: btnStyle, children: "Manage Users" }), _jsx("button", { style: btnStyle, children: "Manage Products" }), _jsx("button", { style: btnStyle, children: "View Reports" })] })] }) }));
}
// --- Support Tools ---
function SupportTools() {
    return (_jsx(Allow, { role: "support", fallback: null, children: _jsxs("div", { style: { ...box, background: '#e8eaf6' }, children: [_jsx("h3", { style: { margin: '0 0 8px' }, children: "\uD83C\uDFA7 Support Tools" }), _jsx(Can, { perform: "orders:view-all", children: _jsx("p", { children: "\u2705 Search & view all orders" }) }), _jsx(Can, { perform: "orders:refund", children: _jsx("p", { children: "\u2705 Process refunds" }) }), _jsx(Can, { perform: "reviews:moderate", children: _jsx("p", { children: "\u2705 Moderate reviews" }) }), _jsx(Can, { perform: "tickets:manage", children: _jsx("p", { children: "\u2705 Manage support tickets (14 open)" }) })] }) }));
}
// --- Checkout A/B Test ---
function CheckoutPreview() {
    const { variant } = useExperiment('checkout-layout');
    const layouts = {
        classic: { label: '📋 Classic Checkout', desc: 'Multi-page: Shipping → Payment → Review → Confirm' },
        'one-page': { label: '📄 One-Page Checkout', desc: 'Everything on a single scrollable page' },
        'step-wizard': { label: '🧙 Step Wizard', desc: 'Guided wizard with progress bar' },
    };
    const layout = layouts[variant] ?? layouts['classic'];
    return (_jsxs("div", { style: { ...box, background: '#f3e5f5' }, children: [_jsx("h4", { style: { margin: '0 0 4px' }, children: layout.label }), _jsxs("p", { style: { margin: '0 0 4px', fontSize: 13, color: '#666' }, children: ["A/B Test: you're seeing variant ", _jsxs("strong", { children: ["\"", variant, "\""] })] }), _jsx("p", { style: { margin: 0 }, children: layout.desc })] }));
}
// --- Reviews A/B Test ---
function ReviewSection() {
    const { enabled } = useFeature('reviews-v2');
    return (_jsxs("div", { style: { ...box, background: enabled ? '#e0f7fa' : '#f5f5f5' }, children: [_jsx("h4", { style: { margin: '0 0 4px' }, children: enabled ? '⭐ Reviews (New UI — v2)' : '⭐ Reviews (Classic)' }), _jsx("p", { style: { margin: 0 }, children: enabled
                    ? 'Rich media reviews with photos, verified badges, and helpful votes'
                    : 'Text-based reviews with star ratings' }), _jsx(Allow, { permission: "reviews:write", children: _jsx("button", { style: { ...btnStyle, marginTop: 8 }, children: "Write a Review" }) })] }));
}
// --- Plan Overview ---
function PlanOverview() {
    const { plan, hasPlanAccess } = usePlan();
    return (_jsxs("div", { style: { ...box, background: '#e8f5e9' }, children: [_jsxs("h4", { style: { margin: '0 0 8px' }, children: ["Your Plan: ", _jsx("strong", { children: plan ?? 'free' })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 14 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: thStyle, children: "Feature" }), _jsx("th", { style: thStyle, children: "Free" }), _jsx("th", { style: thStyle, children: "Plus" }), _jsx("th", { style: thStyle, children: "Premium" })] }) }), _jsx("tbody", { children: [
                            ['Basic shopping', 'free'],
                            ['Live chat support', 'plus'],
                            ['Loyalty points', 'plus'],
                            ['AI recommendations', 'premium'],
                        ].map(([feature, minPlan]) => (_jsxs("tr", { children: [_jsx("td", { style: tdStyle, children: feature }), ['free', 'plus', 'premium'].map((p) => (_jsx("td", { style: { ...tdStyle, textAlign: 'center' }, children: ['free', 'plus', 'premium'].indexOf(p) >= ['free', 'plus', 'premium'].indexOf(minPlan)
                                        ? hasPlanAccess(p) ? '✅' : '🔒'
                                        : '—' }, p)))] }, feature))) })] })] }));
}
// ─────────────────────────────────────────────────────────────────────────────
// 4. MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export function App() {
    const [userKey, setUserKey] = useState('customer');
    const currentUser = users[userKey];
    return (_jsx(AccessProvider, { config: config, user: currentUser, children: _jsxs("div", { style: { maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }, children: [_jsx("h1", { style: { margin: '0 0 4px' }, children: "\uD83D\uDECD\uFE0F ShopEngine" }), _jsxs("p", { style: { margin: '0 0 16px', color: '#666' }, children: ["E-commerce demo powered by ", _jsx("code", { children: "react-access-engine" })] }), _jsxs("div", { style: { ...box, background: '#f5f5f5' }, children: [_jsx("strong", { children: "Switch user:" }), ' ', _jsxs("select", { value: userKey, onChange: (e) => setUserKey(e.target.value), style: { padding: '4px 8px', fontSize: 14 }, children: [_jsx("option", { value: "customer", children: "Customer (Free)" }), _jsx("option", { value: "plusCustomer", children: "Customer (Plus)" }), _jsx("option", { value: "premiumCustomer", children: "Customer (Premium)" }), _jsx("option", { value: "seller", children: "Seller" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "support", children: "Support Agent" })] }), _jsx(UserBadge, {})] }), _jsx(PlanOverview, {}), _jsx("h2", { children: "Products" }), _jsx(ProductCard, { name: "Wireless Headphones", price: 79.99 }), _jsx(ProductCard, { name: "Mechanical Keyboard", price: 149.99 }), _jsx(AIRecommendations, {}), _jsx(LoyaltyBadge, {}), _jsx(ReviewSection, {}), _jsx("h2", { children: "Checkout Experience" }), _jsx(CheckoutPreview, {}), _jsx(LiveChat, {}), _jsx(SellerDashboard, {}), _jsx(AdminPanel, {}), _jsx(SupportTools, {})] }) }));
}
// --- Small helper components ---
function UserBadge() {
    const { user, roles, permissions } = useAccess();
    return (_jsxs("p", { style: { margin: '8px 0 0', fontSize: 13, color: '#555' }, children: ["ID: ", _jsx("code", { children: user.id }), " \u00B7 Roles: ", _jsx("strong", { children: roles.join(', ') }), " \u00B7 ", permissions.length, " permissions"] }));
}
// --- Styles ---
const btnStyle = {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #ccc',
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: 13,
};
const thStyle = {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '2px solid #ccc',
};
const tdStyle = {
    padding: '6px 8px',
    borderBottom: '1px solid #eee',
};
//# sourceMappingURL=App.js.map