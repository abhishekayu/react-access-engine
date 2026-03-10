import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { defineAccess, AccessProvider, Experiment, useExperiment } from 'react-access-engine';
// ---------------------------------------------------------------------------
// Config — two experiments with variant allocation
// ---------------------------------------------------------------------------
const config = defineAccess({
    roles: ['user'],
    permissions: {
        user: ['app:use'],
    },
    experiments: {
        'checkout-redesign': {
            id: 'checkout-redesign',
            variants: ['control', 'single-page', 'wizard'],
            defaultVariant: 'control',
            active: true,
            allocation: { control: 34, 'single-page': 33, wizard: 33 },
        },
        'pricing-page': {
            id: 'pricing-page',
            variants: ['control', 'annual-first'],
            defaultVariant: 'control',
            active: true,
            allocation: { control: 50, 'annual-first': 50 },
        },
        'onboarding-flow': {
            id: 'onboarding-flow',
            variants: ['classic', 'guided-tour', 'video-intro'],
            defaultVariant: 'classic',
            active: false, // inactive — will always render fallback
        },
    },
});
// ---------------------------------------------------------------------------
// Variant components
// ---------------------------------------------------------------------------
const box = (bg) => ({
    padding: 16,
    borderRadius: 8,
    background: bg,
    marginBottom: 12,
});
function CheckoutControl() {
    return _jsx("div", { style: box('#e0e0e0'), children: "\uD83D\uDED2 Control checkout \u2014 multi-step form" });
}
function CheckoutSinglePage() {
    return _jsx("div", { style: box('#c8e6c9'), children: "\uD83D\uDED2 Single-page checkout \u2014 everything on one page" });
}
function CheckoutWizard() {
    return _jsx("div", { style: box('#bbdefb'), children: "\uD83D\uDED2 Wizard checkout \u2014 step-by-step guide" });
}
function PricingControl() {
    return _jsx("div", { style: box('#e0e0e0'), children: "\uD83D\uDCB0 Control pricing \u2014 monthly prices shown first" });
}
function PricingAnnualFirst() {
    return _jsx("div", { style: box('#fff9c4'), children: "\uD83D\uDCB0 Annual-first pricing \u2014 annual savings highlighted" });
}
// ---------------------------------------------------------------------------
// Experiment status panel
// ---------------------------------------------------------------------------
function ExperimentStatus({ id }) {
    const { variant, active } = useExperiment(id);
    return (_jsxs("tr", { children: [_jsx("td", { style: { padding: '4px 12px' }, children: _jsx("code", { children: id }) }), _jsx("td", { style: { padding: '4px 12px', textAlign: 'center' }, children: active ? '✅' : '❌' }), _jsx("td", { style: { padding: '4px 12px' }, children: _jsx("strong", { children: variant }) })] }));
}
function ExperimentDashboard() {
    const experiments = ['checkout-redesign', 'pricing-page', 'onboarding-flow'];
    return (_jsxs("div", { children: [_jsx("h2", { children: "Assignment Summary" }), _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', marginBottom: 24 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '2px solid #ccc' }, children: [_jsx("th", { style: { textAlign: 'left', padding: '4px 12px' }, children: "Experiment" }), _jsx("th", { style: { textAlign: 'center', padding: '4px 12px' }, children: "Active" }), _jsx("th", { style: { textAlign: 'left', padding: '4px 12px' }, children: "Assigned Variant" })] }) }), _jsx("tbody", { children: experiments.map((e) => (_jsx(ExperimentStatus, { id: e }, e))) })] }), _jsx("h2", { children: "Live Experiments" }), _jsx("h3", { children: "Checkout Redesign" }), _jsx(Experiment, { id: "checkout-redesign", variants: {
                    control: _jsx(CheckoutControl, {}),
                    'single-page': _jsx(CheckoutSinglePage, {}),
                    wizard: _jsx(CheckoutWizard, {}),
                }, fallback: _jsx(CheckoutControl, {}) }), _jsx("h3", { children: "Pricing Page" }), _jsx(Experiment, { id: "pricing-page", variants: {
                    control: _jsx(PricingControl, {}),
                    'annual-first': _jsx(PricingAnnualFirst, {}),
                }, fallback: _jsx(PricingControl, {}) }), _jsx("h3", { children: "Onboarding Flow (inactive)" }), _jsx(Experiment, { id: "onboarding-flow", variants: {
                    classic: _jsx("div", { style: box('#e0e0e0'), children: "Classic onboarding" }),
                    'guided-tour': _jsx("div", { style: box('#c8e6c9'), children: "Guided tour" }),
                    'video-intro': _jsx("div", { style: box('#bbdefb'), children: "Video intro" }),
                }, fallback: _jsx("div", { style: box('#ffcdd2'), children: "\u26A0\uFE0F Experiment inactive \u2014 showing fallback" }) })] }));
}
// ---------------------------------------------------------------------------
// App — change user ID to see different variant assignments
// ---------------------------------------------------------------------------
export function App() {
    const [userId, setUserId] = useState('user-1');
    const user = { id: userId, roles: ['user'] };
    return (_jsxs("div", { style: { fontFamily: 'system-ui', maxWidth: 700, margin: '0 auto', padding: 24 }, children: [_jsx("h1", { children: "A/B Experiments Example" }), _jsx("p", { children: "Change the user ID to see how different users are assigned to different variants based on deterministic hashing." }), _jsxs("label", { style: { display: 'block', marginBottom: 24 }, children: ["User ID:", ' ', _jsx("input", { value: userId, onChange: (e) => setUserId(e.target.value), style: { padding: 4, width: 200 } })] }), _jsx(AccessProvider, { config: config, user: user, children: _jsx(ExperimentDashboard, {}) })] }));
}
//# sourceMappingURL=App.js.map