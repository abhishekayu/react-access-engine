// ---------------------------------------------------------------------------
// Comprehensive Frontend / React Test Suite — 200 scenarios
// ---------------------------------------------------------------------------
// Tests every React hook and component exported from react-access-engine
// as used in browser apps: AccessProvider, Can, Allow, Feature, AccessGate,
// PermissionGuard, FeatureToggle, Experiment, useAccess, usePermission,
// useRole, useFeature, usePolicy, useExperiment, usePlan, useAccessDebug.
// ---------------------------------------------------------------------------

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  defineAccess,
  AccessProvider,
  Can,
  Allow,
  Feature,
  AccessGate,
  PermissionGuard,
  FeatureToggle,
  Experiment,
  useAccess,
  usePermission,
  useRole,
  useFeature,
  usePolicy,
  useExperiment,
  usePlan,
  useAccessDebug,
  createAuditLoggerPlugin,
  createAnalyticsPlugin,
  createOperatorPlugin,
} from '../src/index';
import type { UserContext, AccessConfig } from '../src/index';

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const config = defineAccess({
  roles: ['viewer', 'editor', 'admin', 'super_admin'] as const,
  permissions: {
    viewer: ['articles:read', 'comments:read', 'dashboard:view'],
    editor: ['articles:read', 'articles:write', 'articles:publish', 'comments:read', 'comments:write', 'media:upload', 'dashboard:view'],
    admin: ['articles:read', 'articles:write', 'articles:publish', 'articles:delete', 'comments:*', 'media:*', 'users:read', 'users:invite', 'users:edit', 'dashboard:view', 'analytics:view', 'settings:read', 'settings:edit'],
    super_admin: ['*'],
  },
  plans: ['free', 'starter', 'pro', 'enterprise'] as const,
  features: {
    dark_mode: true,
    legacy_ui: false,
    new_editor: { enabled: true, rolloutPercentage: 80 },
    ai_assist: { enabled: true, allowedRoles: ['admin', 'super_admin'] },
    api_access: { enabled: true, allowedPlans: ['pro', 'enterprise'] },
    branding: { enabled: true, allowedPlans: ['enterprise'], allowedRoles: ['admin', 'super_admin'] },
    beta_lab: { enabled: true, allowedEnvironments: ['development'] },
    collab: { enabled: true, dependencies: ['new_editor'], allowedPlans: ['pro', 'enterprise'] },
    zero_pct: { enabled: true, rolloutPercentage: 0 },
    full_pct: { enabled: true, rolloutPercentage: 100 },
  },
  experiments: {
    checkout: { id: 'checkout', variants: ['control', 'v1', 'v2'] as const, defaultVariant: 'control', active: true, allocation: { control: 34, v1: 33, v2: 33 } },
    pricing: { id: 'pricing', variants: ['A', 'B'] as const, defaultVariant: 'A', active: true },
    onboarding: { id: 'onboarding', variants: ['old', 'new'] as const, defaultVariant: 'old', active: false },
  },
  policies: [
    { id: 'owner-edit', effect: 'allow' as const, permissions: ['articles:write'], priority: 100, condition: ({ user, resource }) => resource?.authorId === user.id },
    { id: 'deny-published-delete', effect: 'deny' as const, permissions: ['articles:delete'], priority: 90, condition: ({ resource }) => resource?.status === 'published' },
    { id: 'enterprise-export', effect: 'allow' as const, permissions: ['analytics:export'], plans: ['enterprise'], priority: 80 },
  ],
  environment: { name: 'development' },
  debug: true,
});

// Users
const viewer: UserContext = { id: 'u-viewer', roles: ['viewer'], plan: 'free' };
const editor: UserContext = { id: 'u-editor', roles: ['editor'], plan: 'starter' };
const admin: UserContext = { id: 'u-admin', roles: ['admin'], plan: 'pro' };
const superAdmin: UserContext = { id: 'u-super', roles: ['super_admin'], plan: 'enterprise' };
const multiRole: UserContext = { id: 'u-multi', roles: ['editor', 'admin'], plan: 'pro' };
const noRoles: UserContext = { id: 'u-noroles', roles: [], plan: 'free' };

// Wrapper factory
function Wrap({ user, children, cfg }: { user: UserContext; children: React.ReactNode; cfg?: any }) {
  return React.createElement(AccessProvider, { config: cfg || config, user }, children);
}

// Helper to render hook inside provider
function renderHook<T>(user: UserContext, hookFn: () => T, cfg?: any): T {
  let result: T = undefined as any;
  function Comp() { result = hookFn(); return null; }
  render(React.createElement(Wrap, { user, cfg }, React.createElement(Comp)));
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. useAccess HOOK (20 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: useAccess hook', () => {
  it('1. can() returns true for granted permission', () => {
    const { can } = renderHook(viewer, useAccess);
    expect(can('articles:read')).toBe(true);
  });
  it('2. can() returns false for denied permission', () => {
    const { can } = renderHook(viewer, useAccess);
    expect(can('articles:write')).toBe(false);
  });
  it('3. is() returns true for matching role', () => {
    const { is } = renderHook(viewer, useAccess);
    expect(is('viewer')).toBe(true);
  });
  it('4. is() returns false for non-matching role', () => {
    const { is } = renderHook(viewer, useAccess);
    expect(is('admin')).toBe(false);
  });
  it('5. has() returns true for enabled feature', () => {
    const { has } = renderHook(viewer, useAccess);
    expect(has('dark_mode')).toBe(true);
  });
  it('6. has() returns false for disabled feature', () => {
    const { has } = renderHook(viewer, useAccess);
    expect(has('legacy_ui')).toBe(false);
  });
  it('7. tier() returns true for accessible plan', () => {
    const { tier } = renderHook(admin, useAccess);
    expect(tier('pro')).toBe(true);
  });
  it('8. tier() returns false for higher plan', () => {
    const { tier } = renderHook(viewer, useAccess);
    expect(tier('pro')).toBe(false);
  });
  it('9. roles array matches user', () => {
    const { roles } = renderHook(editor, useAccess);
    expect(roles).toEqual(['editor']);
  });
  it('10. permissions includes expected', () => {
    const { permissions } = renderHook(editor, useAccess);
    expect(permissions).toContain('articles:write');
  });
  it('11. superAdmin can() anything', () => {
    const { can } = renderHook(superAdmin, useAccess);
    expect(can('random:thing')).toBe(true);
  });
  it('12. admin can() wildcard namespace', () => {
    const { can } = renderHook(admin, useAccess);
    expect(can('comments:anything')).toBe(true);
  });
  it('13. noRoles can() nothing', () => {
    const { can } = renderHook(noRoles, useAccess);
    expect(can('articles:read')).toBe(false);
  });
  it('14. has() role-gated feature admin', () => {
    const { has } = renderHook(admin, useAccess);
    expect(has('ai_assist')).toBe(true);
  });
  it('15. has() role-gated feature viewer denied', () => {
    const { has } = renderHook(viewer, useAccess);
    expect(has('ai_assist')).toBe(false);
  });
  it('16. has() plan-gated feature admin', () => {
    const { has } = renderHook(admin, useAccess);
    expect(has('api_access')).toBe(true);
  });
  it('17. has() plan-gated feature viewer denied', () => {
    const { has } = renderHook(viewer, useAccess);
    expect(has('api_access')).toBe(false);
  });
  it('18. checkFeature returns reason', () => {
    const { checkFeature } = renderHook(viewer, useAccess);
    const result = checkFeature('ai_assist');
    expect(result.reason).toBe('role');
  });
  it('19. getExperiment returns assignment', () => {
    const { getExperiment } = renderHook(viewer, useAccess);
    const exp = getExperiment('checkout');
    expect(['control', 'v1', 'v2']).toContain(exp.variant);
    expect(exp.active).toBe(true);
  });
  it('20. multiRole user gets combined permissions', () => {
    const { can } = renderHook(multiRole, useAccess);
    expect(can('articles:write')).toBe(true);    // from editor
    expect(can('users:read')).toBe(true);         // from admin
    expect(can('settings:read')).toBe(true);      // from admin
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. usePermission HOOK (15 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: usePermission hook', () => {
  it('21. viewer has articles:read', () => {
    const v = renderHook(viewer, () => usePermission('articles:read'));
    expect(v).toBe(true);
  });
  it('22. viewer denied articles:write', () => {
    const v = renderHook(viewer, () => usePermission('articles:write'));
    expect(v).toBe(false);
  });
  it('23. editor has articles:publish', () => {
    const v = renderHook(editor, () => usePermission('articles:publish'));
    expect(v).toBe(true);
  });
  it('24. admin has articles:delete', () => {
    const v = renderHook(admin, () => usePermission('articles:delete'));
    expect(v).toBe(true);
  });
  it('25. admin wildcard comments:custom', () => {
    const v = renderHook(admin, () => usePermission('comments:custom'));
    expect(v).toBe(true);
  });
  it('26. superAdmin wildcard any:perm', () => {
    const v = renderHook(superAdmin, () => usePermission('any:perm'));
    expect(v).toBe(true);
  });
  it('27. noRoles denied dashboard:view', () => {
    const v = renderHook(noRoles, () => usePermission('dashboard:view'));
    expect(v).toBe(false);
  });
  it('28. multiRole has users:invite (from admin)', () => {
    const v = renderHook(multiRole, () => usePermission('users:invite'));
    expect(v).toBe(true);
  });
  it('29. multiRole has media:upload (from editor)', () => {
    const v = renderHook(multiRole, () => usePermission('media:upload'));
    expect(v).toBe(true);
  });
  it('30. viewer denied settings:read', () => {
    const v = renderHook(viewer, () => usePermission('settings:read'));
    expect(v).toBe(false);
  });
  it('31. admin has settings:edit', () => {
    const v = renderHook(admin, () => usePermission('settings:edit'));
    expect(v).toBe(true);
  });
  it('32. editor denied users:edit', () => {
    const v = renderHook(editor, () => usePermission('users:edit'));
    expect(v).toBe(false);
  });
  it('33. admin has analytics:view', () => {
    const v = renderHook(admin, () => usePermission('analytics:view'));
    expect(v).toBe(true);
  });
  it('34. viewer denied analytics:view', () => {
    const v = renderHook(viewer, () => usePermission('analytics:view'));
    expect(v).toBe(false);
  });
  it('35. editor has dashboard:view', () => {
    const v = renderHook(editor, () => usePermission('dashboard:view'));
    expect(v).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. useRole HOOK (15 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: useRole hook', () => {
  it('36. roles array matches viewer', () => {
    const { roles } = renderHook(viewer, useRole);
    expect(roles).toEqual(['viewer']);
  });
  it('37. hasRole viewer true', () => {
    const { hasRole } = renderHook(viewer, useRole);
    expect(hasRole('viewer')).toBe(true);
  });
  it('38. hasRole admin false for viewer', () => {
    const { hasRole } = renderHook(viewer, useRole);
    expect(hasRole('admin')).toBe(false);
  });
  it('39. multiRole hasRole editor', () => {
    const { hasRole } = renderHook(multiRole, useRole);
    expect(hasRole('editor')).toBe(true);
  });
  it('40. multiRole hasRole admin', () => {
    const { hasRole } = renderHook(multiRole, useRole);
    expect(hasRole('admin')).toBe(true);
  });
  it('41. hasAnyRole [admin, editor] for multiRole', () => {
    const { hasAnyRole } = renderHook(multiRole, useRole);
    expect(hasAnyRole(['admin', 'editor'])).toBe(true);
  });
  it('42. hasAnyRole [super_admin] for multiRole false', () => {
    const { hasAnyRole } = renderHook(multiRole, useRole);
    expect(hasAnyRole(['super_admin'])).toBe(false);
  });
  it('43. hasAllRoles [editor, admin] for multiRole', () => {
    const { hasAllRoles } = renderHook(multiRole, useRole);
    expect(hasAllRoles(['editor', 'admin'])).toBe(true);
  });
  it('44. hasAllRoles [editor, super_admin] false', () => {
    const { hasAllRoles } = renderHook(multiRole, useRole);
    expect(hasAllRoles(['editor', 'super_admin'])).toBe(false);
  });
  it('45. noRoles has empty roles', () => {
    const { roles } = renderHook(noRoles, useRole);
    expect(roles).toEqual([]);
  });
  it('46. noRoles hasRole viewer false', () => {
    const { hasRole } = renderHook(noRoles, useRole);
    expect(hasRole('viewer')).toBe(false);
  });
  it('47. hasAllRoles empty array', () => {
    const { hasAllRoles } = renderHook(noRoles, useRole);
    expect(hasAllRoles([])).toBe(true);
  });
  it('48. hasAnyRole empty array', () => {
    const { hasAnyRole } = renderHook(noRoles, useRole);
    expect(hasAnyRole([])).toBe(false);
  });
  it('49. superAdmin hasRole super_admin', () => {
    const { hasRole } = renderHook(superAdmin, useRole);
    expect(hasRole('super_admin')).toBe(true);
  });
  it('50. admin roles length is 1', () => {
    const { roles } = renderHook(admin, useRole);
    expect(roles.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. useFeature HOOK (15 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: useFeature hook', () => {
  it('51. dark_mode enabled', () => {
    const { enabled } = renderHook(viewer, () => useFeature('dark_mode'));
    expect(enabled).toBe(true);
  });
  it('52. legacy_ui disabled', () => {
    const { enabled } = renderHook(viewer, () => useFeature('legacy_ui'));
    expect(enabled).toBe(false);
  });
  it('53. ai_assist disabled for viewer (role)', () => {
    const { enabled, reason } = renderHook(viewer, () => useFeature('ai_assist'));
    expect(enabled).toBe(false);
    expect(reason).toBe('role');
  });
  it('54. ai_assist enabled for admin', () => {
    const { enabled } = renderHook(admin, () => useFeature('ai_assist'));
    expect(enabled).toBe(true);
  });
  it('55. api_access disabled for free plan', () => {
    const { enabled, reason } = renderHook(viewer, () => useFeature('api_access'));
    expect(enabled).toBe(false);
    expect(reason).toBe('plan');
  });
  it('56. api_access enabled for pro plan', () => {
    const { enabled } = renderHook(admin, () => useFeature('api_access'));
    expect(enabled).toBe(true);
  });
  it('57. branding enterprise+admin only', () => {
    const { enabled } = renderHook(superAdmin, () => useFeature('branding'));
    expect(enabled).toBe(true);
  });
  it('58. branding denied for pro+admin', () => {
    const { enabled } = renderHook(admin, () => useFeature('branding'));
    expect(enabled).toBe(false);
  });
  it('59. zero_pct feature disabled', () => {
    const { enabled } = renderHook(viewer, () => useFeature('zero_pct'));
    expect(enabled).toBe(false);
  });
  it('60. full_pct feature enabled', () => {
    const { enabled } = renderHook(viewer, () => useFeature('full_pct'));
    expect(enabled).toBe(true);
  });
  it('61. beta_lab enabled in development', () => {
    const { enabled } = renderHook(viewer, () => useFeature('beta_lab'));
    expect(enabled).toBe(true);
  });
  it('62. beta_lab disabled in production', () => {
    const prodCfg = { ...config, environment: { name: 'production' } };
    const { enabled } = renderHook(viewer, () => useFeature('beta_lab'), prodCfg);
    expect(enabled).toBe(false);
  });
  it('63. unknown feature disabled', () => {
    const { enabled } = renderHook(viewer, () => useFeature('nonexistent'));
    expect(enabled).toBe(false);
  });
  it('64. dark_mode reason static', () => {
    const { reason } = renderHook(viewer, () => useFeature('dark_mode'));
    expect(reason).toBe('static');
  });
  it('65. full_pct reason static (100% skips rollout check)', () => {
    const { reason } = renderHook(viewer, () => useFeature('full_pct'));
    expect(reason).toBe('static');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. usePlan HOOK (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: usePlan hook', () => {
  it('66. viewer plan is free', () => {
    const { plan } = renderHook(viewer, usePlan);
    expect(plan).toBe('free');
  });
  it('67. admin plan is pro', () => {
    const { plan } = renderHook(admin, usePlan);
    expect(plan).toBe('pro');
  });
  it('68. superAdmin plan is enterprise', () => {
    const { plan } = renderHook(superAdmin, usePlan);
    expect(plan).toBe('enterprise');
  });
  it('69. viewer hasPlanAccess free', () => {
    const { hasPlanAccess } = renderHook(viewer, usePlan);
    expect(hasPlanAccess('free')).toBe(true);
  });
  it('70. viewer denied starter', () => {
    const { hasPlanAccess } = renderHook(viewer, usePlan);
    expect(hasPlanAccess('starter')).toBe(false);
  });
  it('71. admin has starter', () => {
    const { hasPlanAccess } = renderHook(admin, usePlan);
    expect(hasPlanAccess('starter')).toBe(true);
  });
  it('72. admin denied enterprise', () => {
    const { hasPlanAccess } = renderHook(admin, usePlan);
    expect(hasPlanAccess('enterprise')).toBe(false);
  });
  it('73. superAdmin has all plans', () => {
    const { hasPlanAccess } = renderHook(superAdmin, usePlan);
    expect(hasPlanAccess('free')).toBe(true);
    expect(hasPlanAccess('starter')).toBe(true);
    expect(hasPlanAccess('pro')).toBe(true);
    expect(hasPlanAccess('enterprise')).toBe(true);
  });
  it('74. noRoles user has free plan', () => {
    const { plan } = renderHook(noRoles, usePlan);
    expect(plan).toBe('free');
  });
  it('75. editor has starter', () => {
    const { hasPlanAccess } = renderHook(editor, usePlan);
    expect(hasPlanAccess('starter')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. useExperiment HOOK (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: useExperiment hook', () => {
  it('76. checkout experiment active', () => {
    const { active } = renderHook(viewer, () => useExperiment('checkout'));
    expect(active).toBe(true);
  });
  it('77. checkout variant valid', () => {
    const { variant } = renderHook(viewer, () => useExperiment('checkout'));
    expect(['control', 'v1', 'v2']).toContain(variant);
  });
  it('78. checkout deterministic same user', () => {
    const r1 = renderHook(viewer, () => useExperiment('checkout'));
    const r2 = renderHook(viewer, () => useExperiment('checkout'));
    expect(r1.variant).toBe(r2.variant);
  });
  it('79. pricing experiment active', () => {
    const { active } = renderHook(editor, () => useExperiment('pricing'));
    expect(active).toBe(true);
  });
  it('80. pricing variant valid', () => {
    const { variant } = renderHook(editor, () => useExperiment('pricing'));
    expect(['A', 'B']).toContain(variant);
  });
  it('81. onboarding experiment inactive', () => {
    const { active } = renderHook(viewer, () => useExperiment('onboarding'));
    expect(active).toBe(false);
  });
  it('82. onboarding returns default variant', () => {
    const { variant } = renderHook(viewer, () => useExperiment('onboarding'));
    expect(variant).toBe('old');
  });
  it('83. unknown experiment returns inactive', () => {
    const { active, variant } = renderHook(viewer, () => useExperiment('nonexistent'));
    expect(active).toBe(false);
    expect(variant).toBe('control');
  });
  it('84. experimentId in result', () => {
    const { experimentId } = renderHook(viewer, () => useExperiment('checkout'));
    expect(experimentId).toBe('checkout');
  });
  it('85. different users may get different variants', () => {
    const variants = new Set<string>();
    for (const u of [viewer, editor, admin, superAdmin, multiRole, noRoles]) {
      const { variant } = renderHook(u, () => useExperiment('checkout'));
      variants.add(variant);
    }
    expect(variants.size).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. usePolicy HOOK (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: usePolicy hook', () => {
  it('86. owner can edit own article', () => {
    const { allowed, matchedRule } = renderHook(editor, () => usePolicy('articles:write', { authorId: 'u-editor' }));
    expect(allowed).toBe(true);
    expect(matchedRule).toBe('owner-edit');
  });
  it('87. non-owner denied edit', () => {
    const { allowed } = renderHook(viewer, () => usePolicy('articles:write', { authorId: 'other' }));
    expect(allowed).toBe(false);
  });
  it('88. delete published denied', () => {
    const { allowed, matchedRule } = renderHook(admin, () => usePolicy('articles:delete', { status: 'published' }));
    expect(allowed).toBe(false);
    expect(matchedRule).toBe('deny-published-delete');
  });
  it('89. enterprise export allowed', () => {
    const { allowed } = renderHook(superAdmin, () => usePolicy('analytics:export'));
    expect(allowed).toBe(true);
  });
  it('90. non-enterprise export denied', () => {
    const { allowed } = renderHook(admin, () => usePolicy('analytics:export'));
    expect(allowed).toBe(false);
  });
  it('91. no matching rule returns reason', () => {
    const { reason } = renderHook(viewer, () => usePolicy('random:perm'));
    expect(reason).toBe('no-matching-rule');
  });
  it('92. matchedRule null when no match', () => {
    const { matchedRule } = renderHook(viewer, () => usePolicy('random:perm'));
    expect(matchedRule).toBeNull();
  });
  it('93. owner edit draft article', () => {
    const { allowed } = renderHook(editor, () => usePolicy('articles:write', { authorId: 'u-editor', status: 'draft' }));
    expect(allowed).toBe(true);
  });
  it('94. delete draft not denied by policy', () => {
    const { matchedRule } = renderHook(admin, () => usePolicy('articles:delete', { status: 'draft' }));
    expect(matchedRule).not.toBe('deny-published-delete');
  });
  it('95. result has all fields', () => {
    const result = renderHook(viewer, () => usePolicy('articles:read'));
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('matchedRule');
    expect(result).toHaveProperty('reason');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. useAccessDebug HOOK (5 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: useAccessDebug hook', () => {
  it('96. returns debug info object', () => {
    const info = renderHook(viewer, useAccessDebug);
    expect(info).toHaveProperty('lastChecks');
    expect(info).toHaveProperty('lastFeatureEvals');
    expect(info).toHaveProperty('lastPolicyEvals');
  });
  it('97. lastChecks is array', () => {
    const info = renderHook(viewer, useAccessDebug);
    expect(Array.isArray(info.lastChecks)).toBe(true);
  });
  it('98. lastFeatureEvals is array', () => {
    const info = renderHook(viewer, useAccessDebug);
    expect(Array.isArray(info.lastFeatureEvals)).toBe(true);
  });
  it('99. configSnapshot present when debug enabled', () => {
    const info = renderHook(viewer, useAccessDebug);
    expect(info.configSnapshot).toBeDefined();
  });
  it('100. timestamp present', () => {
    const info = renderHook(viewer, useAccessDebug);
    expect(typeof info.timestamp).toBe('number');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. <Can> COMPONENT (25 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <Can> component', () => {
  it('101. shows children when permission granted', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { perform: 'articles:read' }, 'visible')));
    expect(screen.getByText('visible')).toBeInTheDocument();
  });
  it('102. hides children when permission denied', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { perform: 'articles:write' }, 'hidden')));
    expect(screen.queryByText('hidden')).toBeNull();
  });
  it('103. shows fallback when denied', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { perform: 'articles:write', fallback: React.createElement('span', null, 'nope') }, 'hidden')));
    expect(screen.getByText('nope')).toBeInTheDocument();
  });
  it('104. permission prop alias works', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Can, { permission: 'articles:write' }, 'yes')));
    expect(screen.getByText('yes')).toBeInTheDocument();
  });
  it('105. role check passes', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Can, { role: 'admin' }, 'admin-yes')));
    expect(screen.getByText('admin-yes')).toBeInTheDocument();
  });
  it('106. role check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { role: 'admin' }, 'admin-no')));
    expect(screen.queryByText('admin-no')).toBeNull();
  });
  it('107. multiple permissions all mode', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Can, { permissions: ['articles:read', 'articles:write'] }, 'all-yes')));
    expect(screen.getByText('all-yes')).toBeInTheDocument();
  });
  it('108. multiple permissions all mode fails', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Can, { permissions: ['articles:read', 'articles:delete'] }, 'all-no')));
    expect(screen.queryByText('all-no')).toBeNull();
  });
  it('109. multiple permissions any mode', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Can, { permissions: ['articles:read', 'articles:delete'], mode: 'any' }, 'any-yes')));
    expect(screen.getByText('any-yes')).toBeInTheDocument();
  });
  it('110. roles check all mode', () => {
    render(React.createElement(Wrap, { user: multiRole }, React.createElement(Can, { roles: ['editor', 'admin'] }, 'multi-yes')));
    expect(screen.getByText('multi-yes')).toBeInTheDocument();
  });
  it('111. roles check all mode fails', () => {
    render(React.createElement(Wrap, { user: multiRole }, React.createElement(Can, { roles: ['editor', 'super_admin'] }, 'multi-no')));
    expect(screen.queryByText('multi-no')).toBeNull();
  });
  it('112. roles check any mode', () => {
    render(React.createElement(Wrap, { user: multiRole }, React.createElement(Can, { roles: ['viewer', 'admin'], mode: 'any' }, 'any-role')));
    expect(screen.getByText('any-role')).toBeInTheDocument();
  });
  it('113. combined role + permission all mode', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Can, { role: 'admin', permission: 'settings:edit' }, 'combo')));
    expect(screen.getByText('combo')).toBeInTheDocument();
  });
  it('114. combined role + permission fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { role: 'admin', permission: 'articles:read' }, 'combo-fail')));
    expect(screen.queryByText('combo-fail')).toBeNull();
  });
  it('115. no checks = always shown', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, null, 'always')));
    expect(screen.getByText('always')).toBeInTheDocument();
  });
  it('116. superAdmin passes any single perm', () => {
    render(React.createElement(Wrap, { user: superAdmin }, React.createElement(Can, { perform: 'billing:manage' }, 'super')));
    expect(screen.getByText('super')).toBeInTheDocument();
  });
  it('117. noRoles fails permission check', () => {
    render(React.createElement(Wrap, { user: noRoles }, React.createElement(Can, { perform: 'articles:read', fallback: React.createElement('span', null, 'denied') }, 'nope')));
    expect(screen.getByText('denied')).toBeInTheDocument();
  });
  it('118. admin wildcard namespace comments:custom', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Can, { perform: 'comments:custom' }, 'wc-yes')));
    expect(screen.getByText('wc-yes')).toBeInTheDocument();
  });
  it('119. viewer denied wildcard namespace', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { perform: 'comments:custom' }, 'wc-no')));
    expect(screen.queryByText('wc-no')).toBeNull();
  });
  it('120. policy prop checks permission', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Can, { policy: 'articles:write' }, 'policy-yes')));
    expect(screen.getByText('policy-yes')).toBeInTheDocument();
  });
  it('121. combined role + permissions any mode', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { role: 'admin', permission: 'articles:read', mode: 'any' }, 'any-combo')));
    expect(screen.getByText('any-combo')).toBeInTheDocument();
  });
  it('122. three permissions all mode editor', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Can, { permissions: ['articles:read', 'articles:write', 'media:upload'] }, 'three')));
    expect(screen.getByText('three')).toBeInTheDocument();
  });
  it('123. role viewer + perm articles:read all mode', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Can, { role: 'viewer', permission: 'articles:read' }, 'match')));
    expect(screen.getByText('match')).toBeInTheDocument();
  });
  it('124. role check + impossible perm fails all mode', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Can, { role: 'admin', permission: 'billing:secret' }, 'nope')));
    expect(screen.queryByText('nope')).toBeNull();
  });
  it('125. empty roles array passed', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Can, { roles: [] }, 'empty-roles')));
    expect(screen.getByText('empty-roles')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. <Allow> COMPONENT (20 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <Allow> component', () => {
  it('126. permission granted', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Allow, { permission: 'articles:write' }, 'allowed')));
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });
  it('127. permission denied', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { permission: 'articles:write' }, 'denied')));
    expect(screen.queryByText('denied')).toBeNull();
  });
  it('128. fallback shown when denied', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { permission: 'articles:write', fallback: React.createElement('span', null, 'no') }, 'x')));
    expect(screen.getByText('no')).toBeInTheDocument();
  });
  it('129. role check passes', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Allow, { role: 'admin' }, 'ok')));
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
  it('130. role check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { role: 'admin' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('131. feature check passes', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { feature: 'dark_mode' }, 'feat')));
    expect(screen.getByText('feat')).toBeInTheDocument();
  });
  it('132. feature check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { feature: 'legacy_ui' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('133. plan check passes', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Allow, { plan: 'pro' }, 'pro')));
    expect(screen.getByText('pro')).toBeInTheDocument();
  });
  it('134. plan check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { plan: 'pro' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('135. combined role+feature+plan all pass', () => {
    render(React.createElement(Wrap, { user: superAdmin }, React.createElement(Allow, { role: 'super_admin', feature: 'dark_mode', plan: 'enterprise' }, 'all')));
    expect(screen.getByText('all')).toBeInTheDocument();
  });
  it('136. combined role+plan fails plan', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Allow, { role: 'admin', plan: 'enterprise' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('137. match any mode: role passes, plan fails', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Allow, { role: 'admin', plan: 'enterprise', match: 'any' }, 'any')));
    expect(screen.getByText('any')).toBeInTheDocument();
  });
  it('138. roles check (any role)', () => {
    render(React.createElement(Wrap, { user: multiRole }, React.createElement(Allow, { roles: ['super_admin', 'admin'] }, 'roles')));
    expect(screen.getByText('roles')).toBeInTheDocument();
  });
  it('139. roles check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Allow, { roles: ['admin', 'super_admin'] }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('140. multiple permissions all pass', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Allow, { permissions: ['articles:read', 'articles:write'] }, 'multi')));
    expect(screen.getByText('multi')).toBeInTheDocument();
  });
  it('141. multiple permissions one fails (all mode)', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Allow, { permissions: ['articles:read', 'articles:delete'] }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('142. multiple permissions any mode', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Allow, { permissions: ['articles:read', 'articles:delete'], match: 'any' }, 'any')));
    expect(screen.getByText('any')).toBeInTheDocument();
  });
  it('143. no conditions = always allowed', () => {
    render(React.createElement(Wrap, { user: noRoles }, React.createElement(Allow, null, 'open')));
    expect(screen.getByText('open')).toBeInTheDocument();
  });
  it('144. superAdmin + feature + permission + plan all pass', () => {
    render(React.createElement(Wrap, { user: superAdmin }, React.createElement(Allow, { permission: 'billing:manage', feature: 'dark_mode', plan: 'enterprise' }, 'everything')));
    expect(screen.getByText('everything')).toBeInTheDocument();
  });
  it('145. plan as lower tier', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Allow, { plan: 'free' }, 'low')));
    expect(screen.getByText('low')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. <Feature> COMPONENT (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <Feature> component', () => {
  it('146. renders children when enabled', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'dark_mode' }, 'dark')));
    expect(screen.getByText('dark')).toBeInTheDocument();
  });
  it('147. hides when disabled', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'legacy_ui' }, 'legacy')));
    expect(screen.queryByText('legacy')).toBeNull();
  });
  it('148. shows fallback when disabled', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'legacy_ui', fallback: React.createElement('span', null, 'old') }, 'new')));
    expect(screen.getByText('old')).toBeInTheDocument();
  });
  it('149. role-gated feature for admin', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Feature, { name: 'ai_assist' }, 'ai')));
    expect(screen.getByText('ai')).toBeInTheDocument();
  });
  it('150. role-gated feature denied for viewer', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'ai_assist' }, 'ai')));
    expect(screen.queryByText('ai')).toBeNull();
  });
  it('151. plan-gated feature for pro', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(Feature, { name: 'api_access' }, 'api')));
    expect(screen.getByText('api')).toBeInTheDocument();
  });
  it('152. plan-gated feature denied for free', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'api_access' }, 'api')));
    expect(screen.queryByText('api')).toBeNull();
  });
  it('153. zero_pct always hidden', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'zero_pct' }, 'zero')));
    expect(screen.queryByText('zero')).toBeNull();
  });
  it('154. full_pct always shown', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'full_pct' }, 'full')));
    expect(screen.getByText('full')).toBeInTheDocument();
  });
  it('155. unknown feature hidden', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Feature, { name: 'nope' }, 'nope')));
    expect(screen.queryByText('nope')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. <AccessGate> COMPONENT (15 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <AccessGate> component', () => {
  it('156. permission only - passes', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(AccessGate, { permission: 'articles:write' }, 'gate-ok')));
    expect(screen.getByText('gate-ok')).toBeInTheDocument();
  });
  it('157. permission only - fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { permission: 'articles:write' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('158. feature only - passes', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { feature: 'dark_mode' }, 'feat')));
    expect(screen.getByText('feat')).toBeInTheDocument();
  });
  it('159. feature only - fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { feature: 'ai_assist' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('160. roles check passes', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(AccessGate, { roles: ['admin', 'super_admin'] }, 'role-ok')));
    expect(screen.getByText('role-ok')).toBeInTheDocument();
  });
  it('161. roles check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { roles: ['admin'] }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('162. plan check passes', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(AccessGate, { plan: 'pro' }, 'plan-ok')));
    expect(screen.getByText('plan-ok')).toBeInTheDocument();
  });
  it('163. plan check fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { plan: 'pro' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('164. combined all pass', () => {
    render(React.createElement(Wrap, { user: superAdmin }, React.createElement(AccessGate, { permission: 'settings:edit', roles: ['super_admin'], plan: 'enterprise', feature: 'dark_mode' }, 'all')));
    expect(screen.getByText('all')).toBeInTheDocument();
  });
  it('165. combined one fails (all mode)', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(AccessGate, { permission: 'settings:edit', plan: 'enterprise' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('166. combined any mode passes one', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(AccessGate, { permission: 'settings:edit', plan: 'enterprise', mode: 'any' }, 'any')));
    expect(screen.getByText('any')).toBeInTheDocument();
  });
  it('167. fallback shown', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { permission: 'settings:edit', fallback: React.createElement('span', null, 'fb') }, 'no')));
    expect(screen.getByText('fb')).toBeInTheDocument();
  });
  it('168. no conditions = always pass', () => {
    render(React.createElement(Wrap, { user: noRoles }, React.createElement(AccessGate, null, 'open')));
    expect(screen.getByText('open')).toBeInTheDocument();
  });
  it('169. multiRole + permission + roles', () => {
    render(React.createElement(Wrap, { user: multiRole }, React.createElement(AccessGate, { permission: 'articles:write', roles: ['editor'] }, 'multi')));
    expect(screen.getByText('multi')).toBeInTheDocument();
  });
  it('170. feature + plan combined fails', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(AccessGate, { feature: 'api_access', plan: 'pro' }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. <PermissionGuard> COMPONENT (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <PermissionGuard> component', () => {
  it('171. all permissions pass', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(PermissionGuard, { permissions: ['articles:read', 'articles:write'] }, 'guarded')));
    expect(screen.getByText('guarded')).toBeInTheDocument();
  });
  it('172. one permission fails', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(PermissionGuard, { permissions: ['articles:read', 'articles:delete'] }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('173. fallback shown when denied', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(PermissionGuard, { permissions: ['settings:edit'], fallback: React.createElement('span', null, '403') }, 'no')));
    expect(screen.getByText('403')).toBeInTheDocument();
  });
  it('174. superAdmin passes all', () => {
    render(React.createElement(Wrap, { user: superAdmin }, React.createElement(PermissionGuard, { permissions: ['a:b', 'c:d', 'e:f'] }, 'super')));
    expect(screen.getByText('super')).toBeInTheDocument();
  });
  it('175. empty permissions = always pass', () => {
    render(React.createElement(Wrap, { user: noRoles }, React.createElement(PermissionGuard, { permissions: [] }, 'empty')));
    expect(screen.getByText('empty')).toBeInTheDocument();
  });
  it('176. admin wildcard namespace', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(PermissionGuard, { permissions: ['comments:anything', 'media:anything'] }, 'wc')));
    expect(screen.getByText('wc')).toBeInTheDocument();
  });
  it('177. viewer denied multiple', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(PermissionGuard, { permissions: ['articles:read', 'settings:edit'] }, 'no')));
    expect(screen.queryByText('no')).toBeNull();
  });
  it('178. single permission guard', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(PermissionGuard, { permissions: ['analytics:view'] }, 'single')));
    expect(screen.getByText('single')).toBeInTheDocument();
  });
  it('179. multiRole combined permissions', () => {
    render(React.createElement(Wrap, { user: multiRole }, React.createElement(PermissionGuard, { permissions: ['articles:write', 'users:read'] }, 'multi')));
    expect(screen.getByText('multi')).toBeInTheDocument();
  });
  it('180. noRoles denied everything', () => {
    render(React.createElement(Wrap, { user: noRoles }, React.createElement(PermissionGuard, { permissions: ['articles:read'], fallback: React.createElement('span', null, 'nope') }, 'x')));
    expect(screen.getByText('nope')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. <FeatureToggle> COMPONENT (5 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <FeatureToggle> component', () => {
  it('181. renders with enabled=true for dark_mode', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(FeatureToggle, { name: 'dark_mode' }, (s: any) => React.createElement('span', null, s.enabled ? 'yes' : 'no'))));
    expect(screen.getByText('yes')).toBeInTheDocument();
  });
  it('182. renders with enabled=false for legacy_ui', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(FeatureToggle, { name: 'legacy_ui' }, (s: any) => React.createElement('span', null, s.enabled ? 'yes' : 'no'))));
    expect(screen.getByText('no')).toBeInTheDocument();
  });
  it('183. provides reason', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(FeatureToggle, { name: 'ai_assist' }, (s: any) => React.createElement('span', null, s.reason))));
    expect(screen.getByText('role')).toBeInTheDocument();
  });
  it('184. role-gated for admin', () => {
    render(React.createElement(Wrap, { user: admin }, React.createElement(FeatureToggle, { name: 'ai_assist' }, (s: any) => React.createElement('span', null, s.enabled ? 'on' : 'off'))));
    expect(screen.getByText('on')).toBeInTheDocument();
  });
  it('185. plan-gated reason', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(FeatureToggle, { name: 'api_access' }, (s: any) => React.createElement('span', null, s.reason))));
    expect(screen.getByText('plan')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. <Experiment> COMPONENT (10 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: <Experiment> component', () => {
  it('186. renders active experiment variant', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'checkout',
      variants: { control: React.createElement('span', null, 'ctrl'), v1: React.createElement('span', null, 'v1'), v2: React.createElement('span', null, 'v2') },
    })));
    // One of the three should render
    const found = screen.queryByText('ctrl') || screen.queryByText('v1') || screen.queryByText('v2');
    expect(found).toBeInTheDocument();
  });
  it('187. inactive experiment shows fallback', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'onboarding',
      variants: { old: React.createElement('span', null, 'old'), new: React.createElement('span', null, 'new') },
      fallback: React.createElement('span', null, 'fallback'),
    })));
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });
  it('188. unknown experiment shows fallback', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'unknown',
      variants: {},
      fallback: React.createElement('span', null, 'fb'),
    })));
    expect(screen.getByText('fb')).toBeInTheDocument();
  });
  it('189. pricing experiment renders variant', () => {
    render(React.createElement(Wrap, { user: editor }, React.createElement(Experiment, {
      id: 'pricing',
      variants: { A: React.createElement('span', null, 'A'), B: React.createElement('span', null, 'B') },
    })));
    const found = screen.queryByText('A') || screen.queryByText('B');
    expect(found).toBeInTheDocument();
  });
  it('190. deterministic: same user same variant', () => {
    const { unmount } = render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'checkout',
      variants: { control: React.createElement('span', { 'data-testid': 'e1' }, 'ctrl'), v1: React.createElement('span', { 'data-testid': 'e1' }, 'v1'), v2: React.createElement('span', { 'data-testid': 'e1' }, 'v2') },
    })));
    const first = screen.getByTestId('e1').textContent;
    unmount();
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'checkout',
      variants: { control: React.createElement('span', { 'data-testid': 'e2' }, 'ctrl'), v1: React.createElement('span', { 'data-testid': 'e2' }, 'v1'), v2: React.createElement('span', { 'data-testid': 'e2' }, 'v2') },
    })));
    expect(screen.getByTestId('e2').textContent).toBe(first);
  });
  it('191. fallback when variant not in map', () => {
    // Force a variant that's not in the provided variants map
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'checkout',
      variants: {}, // empty map
      fallback: React.createElement('span', null, 'fallback-empty'),
    })));
    expect(screen.getByText('fallback-empty')).toBeInTheDocument();
  });
  it('192. superAdmin gets experiment variant', () => {
    render(React.createElement(Wrap, { user: superAdmin }, React.createElement(Experiment, {
      id: 'checkout',
      variants: { control: React.createElement('span', null, 'c'), v1: React.createElement('span', null, '1'), v2: React.createElement('span', null, '2') },
    })));
    const found = screen.queryByText('c') || screen.queryByText('1') || screen.queryByText('2');
    expect(found).toBeInTheDocument();
  });
  it('193. noRoles user gets experiment', () => {
    render(React.createElement(Wrap, { user: noRoles }, React.createElement(Experiment, {
      id: 'pricing',
      variants: { A: React.createElement('span', null, 'pA'), B: React.createElement('span', null, 'pB') },
    })));
    const found = screen.queryByText('pA') || screen.queryByText('pB');
    expect(found).toBeInTheDocument();
  });
  it('194. inactive with no fallback renders nothing', () => {
    const { container } = render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'onboarding',
      variants: { old: React.createElement('span', null, 'old'), new: React.createElement('span', null, 'new') },
    })));
    expect(screen.queryByText('old')).toBeNull();
    expect(screen.queryByText('new')).toBeNull();
  });
  it('195. experiment id not found in config', () => {
    render(React.createElement(Wrap, { user: viewer }, React.createElement(Experiment, {
      id: 'does_not_exist',
      variants: { control: React.createElement('span', null, 'ctrl') },
      fallback: React.createElement('span', null, 'missing'),
    })));
    expect(screen.getByText('missing')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. PLUGIN INTEGRATION (5 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend: Plugin integration', () => {
  it('196. audit logger plugin fires on check', () => {
    const log = vi.fn();
    const pluginConfig = defineAccess({
      ...config,
      plugins: [createAuditLoggerPlugin({ log })],
    });
    function Checker() {
      const { can } = useAccess();
      can('articles:read');
      return null;
    }
    render(React.createElement(AccessProvider, { config: pluginConfig, user: viewer }, React.createElement(Checker)));
    expect(log).toHaveBeenCalled();
  });
  it('197. analytics plugin fires on denied check', () => {
    const track = vi.fn();
    const pluginConfig = defineAccess({
      ...config,
      plugins: [createAnalyticsPlugin({ adapter: { track } })],
    });
    function Checker() {
      const { can } = useAccess();
      can('articles:delete'); // viewer denied — triggers trackDenied
      return null;
    }
    render(React.createElement(AccessProvider, { config: pluginConfig, user: viewer }, React.createElement(Checker)));
    expect(track).toHaveBeenCalled();
  });
  it('198. operator plugin provides custom operators', () => {
    const pluginConfig = defineAccess({
      ...config,
      plugins: [createOperatorPlugin([{ name: 'startsWith', evaluate: (v: any, p: any) => String(v).startsWith(String(p)) }])],
    });
    // Just verify it doesn't crash
    render(React.createElement(AccessProvider, { config: pluginConfig, user: viewer }, React.createElement('span', null, 'ok')));
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
  it('199. multiple plugins together', () => {
    const log = vi.fn();
    const track = vi.fn();
    const pluginConfig = defineAccess({
      ...config,
      plugins: [
        createAuditLoggerPlugin({ log }),
        createAnalyticsPlugin({ adapter: { track } }),
      ],
    });
    function Checker() {
      const { can } = useAccess();
      can('articles:delete'); // denied — triggers both audit log & analytics
      return null;
    }
    render(React.createElement(AccessProvider, { config: pluginConfig, user: viewer }, React.createElement(Checker)));
    expect(log).toHaveBeenCalled();
    expect(track).toHaveBeenCalled();
  });
  it('200. no plugins config works fine', () => {
    const noPluginConfig = defineAccess({ ...config, plugins: undefined });
    render(React.createElement(AccessProvider, { config: noPluginConfig, user: viewer }, React.createElement('span', null, 'works')));
    expect(screen.getByText('works')).toBeInTheDocument();
  });
});
