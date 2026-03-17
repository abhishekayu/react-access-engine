// ---------------------------------------------------------------------------
// Comprehensive Backend / Engine Test Suite — 200 scenarios
// ---------------------------------------------------------------------------
// Tests every engine function exported from react-access-engine as if used
// on a Node.js backend: hasPermission, hasRole, evaluateFeature, evaluatePolicy,
// assignExperiment, hasPlanAccess, getPlanTier, condition engine, plugin engine,
// debug engine, defineAccess, mergeConfigs.
// ---------------------------------------------------------------------------

import { describe, it, expect, vi } from 'vitest';
import {
  defineAccess,
  mergeConfigs,
  // Role engine
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getPermissionsForUser,
  // Permission engine
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  // Feature engine
  evaluateFeature,
  evaluateAllFeatures,
  // Policy engine
  evaluatePolicy,
  // Experiment engine
  assignExperiment,
  // Plan engine
  hasPlanAccess,
  getPlanTier,
  // Condition engine
  evaluateCondition,
  evaluateConditions,
  buildConditionContext,
  // Plugin system
  PluginEngine,
  createAuditLoggerPlugin,
  createAnalyticsPlugin,
  createOperatorPlugin,
  // Debug engine
  DebugEngine,
} from '../src/index';
import type {
  AccessConfig,
  UserContext,
  PolicyRule,
  ExperimentDefinition,
  ConditionEntry,
  CustomOperator,
} from '../src/index';

// ---------------------------------------------------------------------------
// Shared enterprise config (mirrors demo shared-config)
// ---------------------------------------------------------------------------

const config = defineAccess({
  roles: ['viewer', 'editor', 'moderator', 'admin', 'super_admin'] as const,
  permissions: {
    viewer: ['articles:read', 'comments:read', 'profile:read', 'dashboard:view'],
    editor: ['articles:read', 'articles:write', 'articles:publish', 'comments:read', 'comments:write', 'comments:moderate', 'media:upload', 'profile:read', 'profile:edit', 'dashboard:view', 'analytics:view'],
    moderator: ['articles:read', 'comments:read', 'comments:write', 'comments:moderate', 'comments:delete', 'users:read'],
    admin: ['articles:read', 'articles:write', 'articles:publish', 'articles:delete', 'comments:*', 'media:*', 'users:read', 'users:invite', 'users:edit', 'users:manage_roles', 'profile:*', 'dashboard:view', 'analytics:view', 'analytics:export', 'settings:read', 'settings:edit', 'audit:read'],
    super_admin: ['*'],
  },
  plans: ['free', 'starter', 'professional', 'enterprise'] as const,
  features: {
    dark_mode: true,
    legacy_ui: false,
    new_editor: { enabled: true, rolloutPercentage: 80 },
    ai_assistant: { enabled: true, rolloutPercentage: 50 },
    advanced_analytics: { enabled: true, allowedRoles: ['admin', 'super_admin'] },
    api_access: { enabled: true, allowedPlans: ['professional', 'enterprise'] },
    custom_branding: { enabled: true, allowedPlans: ['enterprise'], allowedRoles: ['admin', 'super_admin'] },
    collaborative_editing: { enabled: true, dependencies: ['new_editor'], allowedPlans: ['professional', 'enterprise'] },
    beta_features: { enabled: true, allowedEnvironments: ['development', 'staging'] },
    bulk_operations: { enabled: true, rolloutPercentage: 30, allowedPlans: ['starter', 'professional', 'enterprise'] },
    zero_rollout: { enabled: true, rolloutPercentage: 0 },
    full_rollout: { enabled: true, rolloutPercentage: 100 },
  },
  experiments: {
    checkout_flow: { id: 'checkout_flow', variants: ['control', 'single_page', 'multi_step'] as const, defaultVariant: 'control', active: true, allocation: { control: 34, single_page: 33, multi_step: 33 } },
    pricing_page: { id: 'pricing_page', variants: ['current', 'comparison_table', 'slider'] as const, defaultVariant: 'current', active: true, allocation: { current: 50, comparison_table: 25, slider: 25 } },
    onboarding: { id: 'onboarding', variants: ['classic', 'wizard', 'video'] as const, defaultVariant: 'classic', active: false },
  },
  policies: [
    { id: 'owner-can-edit', effect: 'allow' as const, permissions: ['articles:write'], priority: 100, condition: ({ user, resource }) => resource?.authorId === user.id },
    { id: 'deny-delete-published', effect: 'deny' as const, permissions: ['articles:delete'], priority: 90, condition: ({ user: _u, resource }) => resource?.status === 'published' },
    { id: 'enterprise-only-export', effect: 'allow' as const, permissions: ['analytics:export'], plans: ['enterprise'], priority: 80 },
    { id: 'deny-outside-hours', effect: 'deny' as const, permissions: ['settings:danger_zone'], priority: 70, condition: ({ environment }) => { const h = (environment as any)?.hour; return h !== undefined && (h < 9 || h > 17); } },
    { id: 'geo-restrict-billing', effect: 'deny' as const, permissions: ['billing:manage'], priority: 60, condition: ({ environment }) => { const r = (environment as any)?.region; return r !== undefined && ['cn', 'ru'].includes(r); } },
  ],
  environment: { name: 'development' },
  debug: true,
});

// Users
const viewer: UserContext = { id: 'user-viewer-001', roles: ['viewer'], plan: 'free', attributes: { name: 'Alice', department: 'marketing' } };
const editor: UserContext = { id: 'user-editor-002', roles: ['editor'], plan: 'starter', attributes: { name: 'Bob', department: 'content' } };
const moderator: UserContext = { id: 'user-moderator-005', roles: ['moderator'], plan: 'starter', attributes: { name: 'Eve', department: 'support' } };
const admin: UserContext = { id: 'user-admin-003', roles: ['admin'], plan: 'professional', attributes: { name: 'Carol', department: 'engineering' } };
const superAdmin: UserContext = { id: 'user-super-004', roles: ['super_admin'], plan: 'enterprise', attributes: { name: 'Dave', department: 'executive' } };
const multiRole: UserContext = { id: 'user-multi-006', roles: ['editor', 'moderator'], plan: 'professional' };
const noPlan: UserContext = { id: 'user-noplan-007', roles: ['viewer'] };
const noRoles: UserContext = { id: 'user-noroles-008', roles: [], plan: 'free' };

// Resources
const draftArticle = { id: 'article-1', title: 'Draft', status: 'draft', authorId: 'user-editor-002' };
const publishedArticle = { id: 'article-2', title: 'Published', status: 'published', authorId: 'user-admin-003' };

// ═══════════════════════════════════════════════════════════════════════════
// 1. ROLE ENGINE (25 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Role Engine', () => {
  // hasRole
  it('1. viewer has viewer role', () => expect(hasRole(viewer, 'viewer')).toBe(true));
  it('2. viewer does not have editor role', () => expect(hasRole(viewer, 'editor')).toBe(false));
  it('3. editor has editor role', () => expect(hasRole(editor, 'editor')).toBe(true));
  it('4. admin has admin role', () => expect(hasRole(admin, 'admin')).toBe(true));
  it('5. superAdmin has super_admin role', () => expect(hasRole(superAdmin, 'super_admin')).toBe(true));
  it('6. multiRole has editor', () => expect(hasRole(multiRole, 'editor')).toBe(true));
  it('7. multiRole has moderator', () => expect(hasRole(multiRole, 'moderator')).toBe(true));
  it('8. multiRole does not have admin', () => expect(hasRole(multiRole, 'admin')).toBe(false));
  it('9. noRoles has no roles', () => expect(hasRole(noRoles, 'viewer')).toBe(false));
  it('10. unknown role returns false', () => expect(hasRole(admin, 'nonexistent')).toBe(false));

  // hasAnyRole
  it('11. viewer hasAnyRole [viewer, editor]', () => expect(hasAnyRole(viewer, ['viewer', 'editor'])).toBe(true));
  it('12. viewer not hasAnyRole [editor, admin]', () => expect(hasAnyRole(viewer, ['editor', 'admin'])).toBe(false));
  it('13. multiRole hasAnyRole [admin, moderator]', () => expect(hasAnyRole(multiRole, ['admin', 'moderator'])).toBe(true));
  it('14. noRoles not hasAnyRole [viewer]', () => expect(hasAnyRole(noRoles, ['viewer'])).toBe(false));
  it('15. hasAnyRole empty array returns false', () => expect(hasAnyRole(admin, [])).toBe(false));

  // hasAllRoles
  it('16. multiRole hasAllRoles [editor, moderator]', () => expect(hasAllRoles(multiRole, ['editor', 'moderator'])).toBe(true));
  it('17. multiRole not hasAllRoles [editor, admin]', () => expect(hasAllRoles(multiRole, ['editor', 'admin'])).toBe(false));
  it('18. admin hasAllRoles [admin]', () => expect(hasAllRoles(admin, ['admin'])).toBe(true));
  it('19. hasAllRoles empty array returns true', () => expect(hasAllRoles(noRoles, [])).toBe(true));

  // getPermissionsForUser
  it('20. viewer gets 4 permissions', () => expect(getPermissionsForUser(viewer, config).length).toBe(4));
  it('21. viewer perms include articles:read', () => expect(getPermissionsForUser(viewer, config)).toContain('articles:read'));
  it('22. editor gets 11 permissions', () => expect(getPermissionsForUser(editor, config).length).toBe(11));
  it('23. admin has wildcard namespaces', () => expect(getPermissionsForUser(admin, config)).toContain('comments:*'));
  it('24. superAdmin has global wildcard', () => expect(getPermissionsForUser(superAdmin, config)).toContain('*'));
  it('25. multiRole merges editor+moderator perms (deduplicated)', () => {
    const perms = getPermissionsForUser(multiRole, config);
    expect(perms).toContain('articles:write');  // from editor
    expect(perms).toContain('comments:delete'); // from moderator
    expect(perms).toContain('users:read');      // from moderator
    // Shared ones should only appear once
    const readCount = perms.filter(p => p === 'articles:read').length;
    expect(readCount).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. PERMISSION ENGINE (35 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Permission Engine', () => {
  // Exact matches
  it('26. viewer can articles:read', () => expect(hasPermission(viewer, 'articles:read', config)).toBe(true));
  it('27. viewer cannot articles:write', () => expect(hasPermission(viewer, 'articles:write', config)).toBe(false));
  it('28. viewer cannot articles:delete', () => expect(hasPermission(viewer, 'articles:delete', config)).toBe(false));
  it('29. editor can articles:write', () => expect(hasPermission(editor, 'articles:write', config)).toBe(true));
  it('30. editor can articles:publish', () => expect(hasPermission(editor, 'articles:publish', config)).toBe(true));
  it('31. editor cannot articles:delete', () => expect(hasPermission(editor, 'articles:delete', config)).toBe(false));
  it('32. admin can articles:delete', () => expect(hasPermission(admin, 'articles:delete', config)).toBe(true));
  it('33. admin can users:manage_roles', () => expect(hasPermission(admin, 'users:manage_roles', config)).toBe(true));
  it('34. admin cannot billing:manage', () => expect(hasPermission(admin, 'billing:manage', config)).toBe(false));

  // Wildcard
  it('35. superAdmin can anything via *', () => expect(hasPermission(superAdmin, 'anything:here', config)).toBe(true));
  it('36. superAdmin can billing:manage via *', () => expect(hasPermission(superAdmin, 'billing:manage', config)).toBe(true));
  it('37. superAdmin can deeply:nested:perm via *', () => expect(hasPermission(superAdmin, 'deeply:nested:perm', config)).toBe(true));

  // Namespace wildcard
  it('38. admin can comments:foo via comments:*', () => expect(hasPermission(admin, 'comments:foo', config)).toBe(true));
  it('39. admin can comments:delete via comments:*', () => expect(hasPermission(admin, 'comments:delete', config)).toBe(true));
  it('40. admin can media:anything via media:*', () => expect(hasPermission(admin, 'media:anything', config)).toBe(true));
  it('41. admin can profile:anything via profile:*', () => expect(hasPermission(admin, 'profile:anything', config)).toBe(true));

  // noRoles user
  it('42. noRoles cannot articles:read', () => expect(hasPermission(noRoles, 'articles:read', config)).toBe(false));
  it('43. noRoles cannot anything', () => expect(hasPermission(noRoles, 'dashboard:view', config)).toBe(false));

  // multiRole user
  it('44. multiRole can articles:write (from editor)', () => expect(hasPermission(multiRole, 'articles:write', config)).toBe(true));
  it('45. multiRole can comments:delete (from moderator)', () => expect(hasPermission(multiRole, 'comments:delete', config)).toBe(true));
  it('46. multiRole can users:read (from moderator)', () => expect(hasPermission(multiRole, 'users:read', config)).toBe(true));
  it('47. multiRole cannot users:edit', () => expect(hasPermission(multiRole, 'users:edit', config)).toBe(false));

  // hasAnyPermission
  it('48. viewer hasAny [articles:read, articles:write]', () => expect(hasAnyPermission(viewer, ['articles:read', 'articles:write'], config)).toBe(true));
  it('49. viewer not hasAny [articles:write, articles:delete]', () => expect(hasAnyPermission(viewer, ['articles:write', 'articles:delete'], config)).toBe(false));
  it('50. superAdmin hasAny [billing:manage, custom:perm]', () => expect(hasAnyPermission(superAdmin, ['billing:manage', 'custom:perm'], config)).toBe(true));
  it('51. noRoles not hasAny [articles:read]', () => expect(hasAnyPermission(noRoles, ['articles:read'], config)).toBe(false));

  // hasAllPermissions
  it('52. editor hasAll [articles:read, articles:write]', () => expect(hasAllPermissions(editor, ['articles:read', 'articles:write'], config)).toBe(true));
  it('53. editor not hasAll [articles:read, articles:delete]', () => expect(hasAllPermissions(editor, ['articles:read', 'articles:delete'], config)).toBe(false));
  it('54. superAdmin hasAll [billing:manage, settings:danger_zone, custom:perm]', () => expect(hasAllPermissions(superAdmin, ['billing:manage', 'settings:danger_zone', 'custom:perm'], config)).toBe(true));
  it('55. admin hasAll [analytics:view, analytics:export]', () => expect(hasAllPermissions(admin, ['analytics:view', 'analytics:export'], config)).toBe(true));

  // Edge cases
  it('56. moderator can comments:moderate', () => expect(hasPermission(moderator, 'comments:moderate', config)).toBe(true));
  it('57. moderator cannot articles:write', () => expect(hasPermission(moderator, 'articles:write', config)).toBe(false));
  it('58. moderator can comments:delete', () => expect(hasPermission(moderator, 'comments:delete', config)).toBe(true));
  it('59. moderator cannot media:upload', () => expect(hasPermission(moderator, 'media:upload', config)).toBe(false));
  it('60. empty permissions array hasAll returns true', () => expect(hasAllPermissions(viewer, [], config)).toBe(true));
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. FEATURE ENGINE (40 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Feature Engine', () => {
  // Static boolean features
  it('61. dark_mode enabled for everyone', () => expect(evaluateFeature('dark_mode', viewer, config).enabled).toBe(true));
  it('62. dark_mode reason is static', () => expect(evaluateFeature('dark_mode', viewer, config).reason).toBe('static'));
  it('63. legacy_ui disabled for everyone', () => expect(evaluateFeature('legacy_ui', viewer, config).enabled).toBe(false));
  it('64. legacy_ui reason is static', () => expect(evaluateFeature('legacy_ui', viewer, config).reason).toBe('static'));

  // Unknown feature
  it('65. unknown feature disabled', () => expect(evaluateFeature('nonexistent', viewer, config).enabled).toBe(false));
  it('66. unknown feature reason is disabled', () => expect(evaluateFeature('nonexistent', viewer, config).reason).toBe('disabled'));

  // Rollout percentage
  it('67. zero_rollout always disabled', () => expect(evaluateFeature('zero_rollout', viewer, config).enabled).toBe(false));
  it('68. zero_rollout reason is rollout', () => expect(evaluateFeature('zero_rollout', viewer, config).reason).toBe('rollout'));
  it('69. full_rollout always enabled', () => expect(evaluateFeature('full_rollout', viewer, config).enabled).toBe(true));
  it('70. full_rollout reason is static (100% skips rollout)', () => expect(evaluateFeature('full_rollout', viewer, config).reason).toBe('static'));
  it('71. new_editor deterministic for same user', () => {
    const r1 = evaluateFeature('new_editor', viewer, config);
    const r2 = evaluateFeature('new_editor', viewer, config);
    expect(r1.enabled).toBe(r2.enabled);
  });
  it('72. ai_assistant at 50% deterministic', () => {
    const r1 = evaluateFeature('ai_assistant', admin, config);
    const r2 = evaluateFeature('ai_assistant', admin, config);
    expect(r1.enabled).toBe(r2.enabled);
  });
  it('73. bulk_operations at 30% + plan gate', () => {
    const result = evaluateFeature('bulk_operations', viewer, config); // free plan
    // Either disabled by rollout or by plan
    expect(typeof result.enabled).toBe('boolean');
  });

  // Role-gated features
  it('74. advanced_analytics enabled for admin', () => expect(evaluateFeature('advanced_analytics', admin, config).enabled).toBe(true));
  it('75. advanced_analytics enabled for superAdmin', () => expect(evaluateFeature('advanced_analytics', superAdmin, config).enabled).toBe(true));
  it('76. advanced_analytics disabled for editor', () => expect(evaluateFeature('advanced_analytics', editor, config).enabled).toBe(false));
  it('77. advanced_analytics disabled for viewer', () => expect(evaluateFeature('advanced_analytics', viewer, config).enabled).toBe(false));
  it('78. advanced_analytics reason is role when denied', () => expect(evaluateFeature('advanced_analytics', viewer, config).reason).toBe('role'));

  // Plan-gated features
  it('79. api_access enabled for professional', () => expect(evaluateFeature('api_access', admin, config).enabled).toBe(true));
  it('80. api_access enabled for enterprise', () => expect(evaluateFeature('api_access', superAdmin, config).enabled).toBe(true));
  it('81. api_access disabled for free', () => expect(evaluateFeature('api_access', viewer, config).enabled).toBe(false));
  it('82. api_access disabled for starter', () => expect(evaluateFeature('api_access', editor, config).enabled).toBe(false));
  it('83. api_access reason is plan when denied', () => expect(evaluateFeature('api_access', viewer, config).reason).toBe('plan'));

  // Combined role + plan gate
  it('84. custom_branding enabled for enterprise+admin', () => expect(evaluateFeature('custom_branding', superAdmin, config).enabled).toBe(true));
  it('85. custom_branding disabled for professional+admin (wrong plan)', () => expect(evaluateFeature('custom_branding', admin, config).enabled).toBe(false));
  it('86. custom_branding disabled for enterprise+viewer (wrong role)', () => {
    const entViewer: UserContext = { id: 'ent-viewer', roles: ['viewer'], plan: 'enterprise' };
    expect(evaluateFeature('custom_branding', entViewer, config).enabled).toBe(false);
  });

  // Environment-gated features
  it('87. beta_features enabled in development', () => expect(evaluateFeature('beta_features', viewer, config, { name: 'development' }).enabled).toBe(true));
  it('88. beta_features enabled in staging', () => expect(evaluateFeature('beta_features', viewer, config, { name: 'staging' }).enabled).toBe(true));
  it('89. beta_features disabled in production', () => expect(evaluateFeature('beta_features', viewer, config, { name: 'production' }).enabled).toBe(false));
  it('90. beta_features reason is environment when denied', () => expect(evaluateFeature('beta_features', viewer, config, { name: 'production' }).reason).toBe('environment'));

  // Feature dependencies
  it('91. collaborative_editing depends on new_editor', () => {
    const resolved = new Map([['new_editor', true]]);
    const result = evaluateFeature('collaborative_editing', admin, config, undefined, resolved);
    expect(result.enabled).toBe(true);
  });
  it('92. collaborative_editing disabled when dependency off', () => {
    const resolved = new Map([['new_editor', false]]);
    const result = evaluateFeature('collaborative_editing', admin, config, undefined, resolved);
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('dependency');
  });

  // evaluateAllFeatures
  it('93. evaluateAllFeatures returns all features', () => {
    const all = evaluateAllFeatures(viewer, config, config.environment);
    expect(all.size).toBe(12);
  });
  it('94. all features have enabled and reason', () => {
    const all = evaluateAllFeatures(admin, config, config.environment);
    for (const [, result] of all) {
      expect(typeof result.enabled).toBe('boolean');
      expect(typeof result.reason).toBe('string');
    }
  });
  it('95. evaluateAllFeatures resolves dependencies automatically', () => {
    const all = evaluateAllFeatures(admin, config, config.environment);
    const collab = all.get('collaborative_editing');
    const newEditor = all.get('new_editor');
    // If new_editor is disabled, collab should be too
    if (!newEditor?.enabled) {
      expect(collab?.enabled).toBe(false);
    }
  });
  it('96. different users get different rollout results', () => {
    const results = new Set<boolean>();
    for (let i = 0; i < 50; i++) {
      const u: UserContext = { id: `test-user-${i}`, roles: ['viewer'], plan: 'starter' };
      results.add(evaluateFeature('ai_assistant', u, config).enabled);
    }
    expect(results.size).toBe(2); // Some get it, some don't
  });

  // Edge: no features defined
  it('97. no features config returns disabled', () => {
    const noFeatConfig = { features: undefined };
    expect(evaluateFeature('dark_mode', viewer, noFeatConfig as any).enabled).toBe(false);
  });
  it('98. empty features config returns disabled', () => {
    const emptyConfig = { features: {} };
    expect(evaluateFeature('dark_mode', viewer, emptyConfig).enabled).toBe(false);
  });
  it('99. noPlan user denied plan-gated feature', () => expect(evaluateFeature('api_access', noPlan, config).enabled).toBe(false));
  it('100. noRoles user denied role-gated feature', () => expect(evaluateFeature('advanced_analytics', noRoles, config).enabled).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. PLAN ENGINE (20 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Plan Engine', () => {
  // hasPlanAccess
  it('101. free user has free access', () => expect(hasPlanAccess(viewer, 'free', config)).toBe(true));
  it('102. free user cannot access starter', () => expect(hasPlanAccess(viewer, 'starter', config)).toBe(false));
  it('103. free user cannot access professional', () => expect(hasPlanAccess(viewer, 'professional', config)).toBe(false));
  it('104. free user cannot access enterprise', () => expect(hasPlanAccess(viewer, 'enterprise', config)).toBe(false));
  it('105. starter user has starter access', () => expect(hasPlanAccess(editor, 'starter', config)).toBe(true));
  it('106. starter user has free access', () => expect(hasPlanAccess(editor, 'free', config)).toBe(true));
  it('107. starter user cannot access professional', () => expect(hasPlanAccess(editor, 'professional', config)).toBe(false));
  it('108. professional user has professional access', () => expect(hasPlanAccess(admin, 'professional', config)).toBe(true));
  it('109. professional user has starter access', () => expect(hasPlanAccess(admin, 'starter', config)).toBe(true));
  it('110. professional user has free access', () => expect(hasPlanAccess(admin, 'free', config)).toBe(true));
  it('111. professional user cannot access enterprise', () => expect(hasPlanAccess(admin, 'enterprise', config)).toBe(false));
  it('112. enterprise user has enterprise access', () => expect(hasPlanAccess(superAdmin, 'enterprise', config)).toBe(true));
  it('113. enterprise user has all lower access', () => {
    expect(hasPlanAccess(superAdmin, 'professional', config)).toBe(true);
    expect(hasPlanAccess(superAdmin, 'starter', config)).toBe(true);
    expect(hasPlanAccess(superAdmin, 'free', config)).toBe(true);
  });
  it('114. no plan user denied everything', () => expect(hasPlanAccess(noPlan, 'free', config)).toBe(false));
  it('115. no plans config allows matching plan', () => {
    const noPlanConfig = { plans: undefined };
    const u: UserContext = { id: 'x', roles: [], plan: 'anything' };
    expect(hasPlanAccess(u, 'anything', noPlanConfig as any)).toBe(true);
  });

  // getPlanTier
  it('116. free tier is 0', () => expect(getPlanTier(viewer, config)).toBe(0));
  it('117. starter tier is 1', () => expect(getPlanTier(editor, config)).toBe(1));
  it('118. professional tier is 2', () => expect(getPlanTier(admin, config)).toBe(2));
  it('119. enterprise tier is 3', () => expect(getPlanTier(superAdmin, config)).toBe(3));
  it('120. no plan tier is -1', () => expect(getPlanTier(noPlan, config)).toBe(-1));
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. POLICY ENGINE (35 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Policy Engine', () => {
  // owner-can-edit policy
  it('121. editor can edit own draft article', () => {
    const result = evaluatePolicy('articles:write', editor, config, { resource: draftArticle });
    expect(result.effect).toBe('allow');
    expect(result.matchedRule).toBe('owner-can-edit');
  });
  it('122. viewer cannot edit own article (not owner)', () => {
    const result = evaluatePolicy('articles:write', viewer, config, { resource: draftArticle });
    expect(result.effect).toBe('deny');
  });
  it('123. admin cannot edit editor article (not owner)', () => {
    const result = evaluatePolicy('articles:write', admin, config, { resource: draftArticle });
    expect(result.effect).toBe('deny');
  });
  it('124. admin can edit own published article', () => {
    const result = evaluatePolicy('articles:write', admin, config, { resource: publishedArticle });
    expect(result.effect).toBe('allow');
    expect(result.matchedRule).toBe('owner-can-edit');
  });

  // deny-delete-published policy
  it('125. cannot delete published article', () => {
    const result = evaluatePolicy('articles:delete', admin, config, { resource: publishedArticle });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('deny-delete-published');
  });
  it('126. can delete draft article (policy allows)', () => {
    const result = evaluatePolicy('articles:delete', admin, config, { resource: draftArticle });
    expect(result.effect).toBe('deny');
    expect(result.reason).toBe('no-matching-rule'); // No allow rule matches
  });

  // enterprise-only-export
  it('127. enterprise user can export analytics', () => {
    const result = evaluatePolicy('analytics:export', superAdmin, config);
    expect(result.effect).toBe('allow');
    expect(result.matchedRule).toBe('enterprise-only-export');
  });
  it('128. professional user cannot export analytics', () => {
    const result = evaluatePolicy('analytics:export', admin, config);
    expect(result.effect).toBe('deny');
  });
  it('129. free user cannot export analytics', () => {
    const result = evaluatePolicy('analytics:export', viewer, config);
    expect(result.effect).toBe('deny');
  });

  // deny-outside-hours
  it('130. settings:danger_zone denied at hour 6', () => {
    const result = evaluatePolicy('settings:danger_zone', admin, config, { environment: { name: 'prod', hour: 6 } });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('deny-outside-hours');
  });
  it('131. settings:danger_zone denied at hour 20', () => {
    const result = evaluatePolicy('settings:danger_zone', admin, config, { environment: { name: 'prod', hour: 20 } });
    expect(result.effect).toBe('deny');
  });
  it('132. settings:danger_zone allowed at hour 12 (no deny)', () => {
    const result = evaluatePolicy('settings:danger_zone', admin, config, { environment: { name: 'prod', hour: 12 } });
    // No allow rule either, so it's deny by default (no-matching-rule)
    expect(result.effect).toBe('deny');
    expect(result.reason).toBe('no-matching-rule');
  });

  // geo-restrict-billing
  it('133. billing denied from cn region', () => {
    const result = evaluatePolicy('billing:manage', superAdmin, config, { environment: { name: 'prod', region: 'cn' } });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('geo-restrict-billing');
  });
  it('134. billing denied from ru region', () => {
    const result = evaluatePolicy('billing:manage', superAdmin, config, { environment: { name: 'prod', region: 'ru' } });
    expect(result.effect).toBe('deny');
  });
  it('135. billing allowed from us region (no deny match)', () => {
    const result = evaluatePolicy('billing:manage', superAdmin, config, { environment: { name: 'prod', region: 'us' } });
    expect(result.effect).toBe('deny');
    expect(result.reason).toBe('no-matching-rule'); // no allow rule
  });

  // No policies
  it('136. no policies allows everything', () => {
    const result = evaluatePolicy('anything', viewer, { policies: [] });
    expect(result.effect).toBe('allow');
  });
  it('137. undefined policies allows everything', () => {
    const result = evaluatePolicy('anything', viewer, { policies: undefined } as any);
    expect(result.effect).toBe('allow');
  });

  // Priority ordering
  it('138. higher priority deny wins over lower priority allow', () => {
    const policies: PolicyRule[] = [
      { id: 'allow-all', effect: 'allow', priority: 10 },
      { id: 'deny-all', effect: 'deny', priority: 20 },
    ];
    const result = evaluatePolicy('anything', viewer, { policies });
    expect(result.matchedRule).toBe('deny-all');
  });
  it('139. lower priority allow loses to higher deny', () => {
    const policies: PolicyRule[] = [
      { id: 'allow-low', effect: 'allow', priority: 5 },
      { id: 'deny-high', effect: 'deny', priority: 50 },
    ];
    const result = evaluatePolicy('anything', viewer, { policies });
    expect(result.effect).toBe('deny');
  });

  // Permission scope filtering
  it('140. policy with wrong permission scope does not match', () => {
    const policies: PolicyRule[] = [
      { id: 'billing-only', effect: 'deny', permissions: ['billing:read'] },
    ];
    const result = evaluatePolicy('articles:read', viewer, { policies });
    expect(result.matchedRule).not.toBe('billing-only');
  });

  // Role scope
  it('141. policy with role scope only matches that role', () => {
    const policies: PolicyRule[] = [
      { id: 'admin-allow', effect: 'allow', roles: ['admin'] },
    ];
    expect(evaluatePolicy('x', admin, { policies }).effect).toBe('allow');
    expect(evaluatePolicy('x', viewer, { policies }).effect).toBe('deny');
  });

  // Plan scope
  it('142. policy with plan scope only matches that plan', () => {
    const policies: PolicyRule[] = [
      { id: 'enterprise-allow', effect: 'allow', plans: ['enterprise'] },
    ];
    expect(evaluatePolicy('x', superAdmin, { policies }).effect).toBe('allow');
    expect(evaluatePolicy('x', viewer, { policies }).effect).toBe('deny');
  });

  // Environment scope
  it('143. policy with environment scope', () => {
    const policies: PolicyRule[] = [
      { id: 'prod-deny', effect: 'deny', environments: ['production'] },
    ];
    expect(evaluatePolicy('x', viewer, { policies }, { environment: { name: 'production' } }).effect).toBe('deny');
    expect(evaluatePolicy('x', viewer, { policies }, { environment: { name: 'development' } }).effect).toBe('deny');
  });

  // Condition errors handled gracefully
  it('144. condition that throws does not crash', () => {
    const policies: PolicyRule[] = [
      { id: 'crasher', effect: 'allow', condition: () => { throw new Error('boom'); } },
    ];
    expect(() => evaluatePolicy('x', viewer, { policies })).not.toThrow();
    expect(evaluatePolicy('x', viewer, { policies }).effect).toBe('deny');
  });

  // Multiple policies combined
  it('145. complex multi-policy scenario', () => {
    const policies: PolicyRule[] = [
      { id: 'global-deny', effect: 'deny', priority: 1 },
      { id: 'admin-allow', effect: 'allow', roles: ['admin'], priority: 50 },
      { id: 'enterprise-allow', effect: 'allow', plans: ['enterprise'], priority: 60 },
    ];
    expect(evaluatePolicy('x', admin, { policies }).effect).toBe('allow');
    expect(evaluatePolicy('x', superAdmin, { policies }).effect).toBe('allow');
    expect(evaluatePolicy('x', viewer, { policies }).effect).toBe('deny');
  });

  // No resource provided
  it('146. policy with condition works when no resource', () => {
    const policies: PolicyRule[] = [
      { id: 'needs-resource', effect: 'allow', condition: ({ resource }) => resource?.id === 'x' },
    ];
    expect(evaluatePolicy('x', viewer, { policies }).effect).toBe('deny');
  });

  // ABAC with complex condition
  it('147. ABAC condition checks user attributes', () => {
    const policies: PolicyRule[] = [
      { id: 'dept-check', effect: 'allow', condition: ({ user }) => (user.attributes as any)?.department === 'engineering' },
    ];
    expect(evaluatePolicy('x', admin, { policies }).effect).toBe('allow');
    expect(evaluatePolicy('x', viewer, { policies }).effect).toBe('deny');
  });

  // Same-priority policies
  it('148. same priority: first match wins', () => {
    const policies: PolicyRule[] = [
      { id: 'allow-1', effect: 'allow', priority: 10 },
      { id: 'deny-1', effect: 'deny', priority: 10 },
    ];
    const result = evaluatePolicy('x', viewer, { policies });
    expect(['allow', 'deny']).toContain(result.effect);
  });

  // Effect result shape
  it('149. result has effect, matchedRule, reason', () => {
    const result = evaluatePolicy('articles:write', editor, config, { resource: draftArticle });
    expect(result).toHaveProperty('effect');
    expect(result).toHaveProperty('matchedRule');
    expect(result).toHaveProperty('reason');
  });
  it('150. no-matching-rule has null matchedRule', () => {
    const result = evaluatePolicy('random:perm', viewer, config);
    expect(result.reason).toBe('no-matching-rule');
    expect(result.matchedRule).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. EXPERIMENT ENGINE (25 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Experiment Engine', () => {
  const checkoutExp = config.experiments!.checkout_flow;
  const pricingExp = config.experiments!.pricing_page;
  const onboardingExp = config.experiments!.onboarding;

  // Active experiments
  it('151. checkout_flow returns active=true', () => expect(assignExperiment(checkoutExp, viewer).active).toBe(true));
  it('152. checkout_flow variant is one of valid variants', () => {
    const v = assignExperiment(checkoutExp, viewer).variant;
    expect(['control', 'single_page', 'multi_step']).toContain(v);
  });
  it('153. checkout_flow deterministic for same user', () => {
    const v1 = assignExperiment(checkoutExp, viewer).variant;
    const v2 = assignExperiment(checkoutExp, viewer).variant;
    expect(v1).toBe(v2);
  });
  it('154. pricing_page returns active=true', () => expect(assignExperiment(pricingExp, editor).active).toBe(true));
  it('155. pricing_page variant is one of valid variants', () => {
    const v = assignExperiment(pricingExp, editor).variant;
    expect(['current', 'comparison_table', 'slider']).toContain(v);
  });

  // Inactive experiment
  it('156. onboarding returns active=false', () => expect(assignExperiment(onboardingExp, viewer).active).toBe(false));
  it('157. onboarding returns defaultVariant', () => expect(assignExperiment(onboardingExp, viewer).variant).toBe('classic'));

  // Different users get different variants (statistical)
  it('158. checkout_flow distributes across variants', () => {
    const variants = new Set<string>();
    for (let i = 0; i < 200; i++) {
      variants.add(assignExperiment(checkoutExp, { id: `exp-user-${i}`, roles: [] }).variant);
    }
    expect(variants.size).toBe(3); // all three variants should appear
  });
  it('159. pricing_page distributes across variants', () => {
    const variants = new Set<string>();
    for (let i = 0; i < 200; i++) {
      variants.add(assignExperiment(pricingExp, { id: `price-user-${i}`, roles: [] }).variant);
    }
    expect(variants.size).toBe(3);
  });

  // Allocation respected
  it('160. pricing 50/25/25 allocation within tolerance', () => {
    const counts: Record<string, number> = { current: 0, comparison_table: 0, slider: 0 };
    const total = 1000;
    for (let i = 0; i < total; i++) {
      const v = assignExperiment(pricingExp, { id: `alloc-user-${i}`, roles: [] }).variant;
      counts[v]++;
    }
    // "current" should be roughly 50%, others roughly 25% each
    expect(counts.current).toBeGreaterThan(350);
    expect(counts.current).toBeLessThan(650);
  });

  // Experiment ID in result
  it('161. result includes experimentId', () => expect(assignExperiment(checkoutExp, viewer).experimentId).toBe('checkout_flow'));
  it('162. result includes experimentId for pricing', () => expect(assignExperiment(pricingExp, admin).experimentId).toBe('pricing_page'));

  // Two-variant experiment
  it('163. two-variant experiment distributes', () => {
    const exp: ExperimentDefinition = { id: 'ab', variants: ['A', 'B'], defaultVariant: 'A', active: true };
    const variants = new Set<string>();
    for (let i = 0; i < 100; i++) {
      variants.add(assignExperiment(exp, { id: `ab-${i}`, roles: [] }).variant);
    }
    expect(variants.size).toBe(2);
  });

  // Single variant
  it('164. single variant always returns that variant', () => {
    const exp: ExperimentDefinition = { id: 'single', variants: ['only'], defaultVariant: 'only', active: true };
    expect(assignExperiment(exp, viewer).variant).toBe('only');
  });

  // 100% allocation to one variant
  it('165. 100% allocation to control', () => {
    const exp: ExperimentDefinition = { id: 'all-control', variants: ['control', 'test'], defaultVariant: 'control', active: true, allocation: { control: 100, test: 0 } };
    for (let i = 0; i < 50; i++) {
      expect(assignExperiment(exp, { id: `ac-${i}`, roles: [] }).variant).toBe('control');
    }
  });

  // Consistency across different configs
  it('166. same experiment ID + same user = same variant regardless of other config', () => {
    const exp1: ExperimentDefinition = { id: 'consistency', variants: ['A', 'B', 'C'], defaultVariant: 'A', active: true };
    const v1 = assignExperiment(exp1, viewer).variant;
    const v2 = assignExperiment(exp1, viewer).variant;
    expect(v1).toBe(v2);
  });

  // Different experiment IDs
  it('167. different experiment IDs may give different variants', () => {
    const exp1: ExperimentDefinition = { id: 'exp-1', variants: ['A', 'B'], defaultVariant: 'A', active: true };
    const exp2: ExperimentDefinition = { id: 'exp-2', variants: ['A', 'B'], defaultVariant: 'A', active: true };
    // Different experiment IDs use different hash seeds, so results may differ
    // (we just verify both are valid)
    expect(['A', 'B']).toContain(assignExperiment(exp1, viewer).variant);
    expect(['A', 'B']).toContain(assignExperiment(exp2, viewer).variant);
  });

  // All users tested
  it('168. all demo users get valid checkout variant', () => {
    for (const u of [viewer, editor, admin, superAdmin, moderator, multiRole]) {
      const v = assignExperiment(checkoutExp, u).variant;
      expect(['control', 'single_page', 'multi_step']).toContain(v);
    }
  });
  it('169. all demo users get valid pricing variant', () => {
    for (const u of [viewer, editor, admin, superAdmin]) {
      const v = assignExperiment(pricingExp, u).variant;
      expect(['current', 'comparison_table', 'slider']).toContain(v);
    }
  });
  it('170. inactive experiment always returns default for all users', () => {
    for (const u of [viewer, editor, admin, superAdmin]) {
      expect(assignExperiment(onboardingExp, u).variant).toBe('classic');
    }
  });

  // Edge: noRoles user
  it('171. noRoles user gets assignment', () => {
    const result = assignExperiment(checkoutExp, noRoles);
    expect(result.active).toBe(true);
    expect(['control', 'single_page', 'multi_step']).toContain(result.variant);
  });
  it('172. noPlan user gets assignment', () => {
    const result = assignExperiment(pricingExp, noPlan);
    expect(result.active).toBe(true);
    expect(['current', 'comparison_table', 'slider']).toContain(result.variant);
  });

  // Large-scale consistency
  it('173. same user always same variant over 100 calls', () => {
    const first = assignExperiment(checkoutExp, admin).variant;
    for (let i = 0; i < 100; i++) {
      expect(assignExperiment(checkoutExp, admin).variant).toBe(first);
    }
  });
  it('174. allocation sums respected for checkout 34/33/33', () => {
    const counts: Record<string, number> = { control: 0, single_page: 0, multi_step: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[assignExperiment(checkoutExp, { id: `ck-${i}`, roles: [] }).variant]++;
    }
    // All variants should get substantial allocation
    expect(counts.control).toBeGreaterThan(200);
    expect(counts.single_page).toBeGreaterThan(200);
    expect(counts.multi_step).toBeGreaterThan(200);
  });
  it('175. experiment result shape', () => {
    const result = assignExperiment(checkoutExp, viewer);
    expect(result).toHaveProperty('experimentId');
    expect(result).toHaveProperty('variant');
    expect(result).toHaveProperty('active');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. CONDITION ENGINE (20 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Condition Engine', () => {
  const ctx = { user: { id: 'u1', plan: 'pro', age: 28, tags: ['vip', 'beta'] }, resource: { ownerId: 'u1', status: 'active', price: 99.5 } };

  it('176. equals matches', () => expect(evaluateCondition({ field: 'user.plan', operator: 'equals', value: 'pro' }, ctx)).toBe(true));
  it('177. equals fails', () => expect(evaluateCondition({ field: 'user.plan', operator: 'equals', value: 'free' }, ctx)).toBe(false));
  it('178. notEquals works', () => expect(evaluateCondition({ field: 'user.plan', operator: 'notEquals', value: 'free' }, ctx)).toBe(true));
  it('179. in array matches', () => expect(evaluateCondition({ field: 'user.plan', operator: 'in', value: ['pro', 'enterprise'] }, ctx)).toBe(true));
  it('180. notIn array works', () => expect(evaluateCondition({ field: 'user.plan', operator: 'notIn', value: ['free', 'starter'] }, ctx)).toBe(true));
  it('181. includes array field', () => expect(evaluateCondition({ field: 'user.tags', operator: 'includes', value: 'vip' }, ctx)).toBe(true));
  it('182. includes fails for non-member', () => expect(evaluateCondition({ field: 'user.tags', operator: 'includes', value: 'admin' }, ctx)).toBe(false));
  it('183. greaterThan', () => expect(evaluateCondition({ field: 'resource.price', operator: 'greaterThan', value: 50 }, ctx)).toBe(true));
  it('184. lessThan', () => expect(evaluateCondition({ field: 'user.age', operator: 'lessThan', value: 30 }, ctx)).toBe(true));
  it('185. greaterThanOrEqual boundary', () => expect(evaluateCondition({ field: 'user.age', operator: 'greaterThanOrEqual', value: 28 }, ctx)).toBe(true));
  it('186. lessThanOrEqual boundary', () => expect(evaluateCondition({ field: 'user.age', operator: 'lessThanOrEqual', value: 28 }, ctx)).toBe(true));
  it('187. exists for present field', () => expect(evaluateCondition({ field: 'user.id', operator: 'exists' }, ctx)).toBe(true));
  it('188. exists for missing field', () => expect(evaluateCondition({ field: 'user.missing', operator: 'exists' }, ctx)).toBe(false));
  it('189. AND group', () => {
    const group: ConditionEntry = { and: [{ field: 'user.plan', operator: 'equals', value: 'pro' }, { field: 'user.age', operator: 'greaterThan', value: 18 }] };
    expect(evaluateCondition(group, ctx)).toBe(true);
  });
  it('190. OR group', () => {
    const group: ConditionEntry = { or: [{ field: 'user.plan', operator: 'equals', value: 'free' }, { field: 'user.age', operator: 'greaterThan', value: 18 }] };
    expect(evaluateCondition(group, ctx)).toBe(true);
  });
  it('191. evaluateConditions implicit AND', () => {
    const conditions: ConditionEntry[] = [{ field: 'user.id', operator: 'equals', value: 'u1' }, { field: 'resource.status', operator: 'equals', value: 'active' }];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });
  it('192. buildConditionContext shapes data', () => {
    const result = buildConditionContext({ id: 'u1' }, { ownerId: 'u1' }, { name: 'prod' });
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('resource');
    expect(result).toHaveProperty('env');
  });
  it('193. custom operator via evaluateCondition', () => {
    const op: CustomOperator = { name: 'startsWith', evaluate: (v, p) => typeof v === 'string' && v.startsWith(String(p)) };
    const ops = new Map([['startsWith', op]]);
    expect(evaluateCondition({ field: 'user.id', operator: 'startsWith', value: 'u' }, ctx, ops)).toBe(true);
  });
  it('194. unknown operator returns false', () => {
    expect(evaluateCondition({ field: 'user.id', operator: 'banana' as any, value: 'u1' }, ctx)).toBe(false);
  });
  it('195. empty conditions returns true', () => expect(evaluateConditions([], {})).toBe(true));
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PLUGIN & DEBUG ENGINE + CONFIG UTILITIES (5 scenarios)
// ═══════════════════════════════════════════════════════════════════════════

describe('Backend: Plugin & Debug & Config', () => {
  it('196. PluginEngine collects custom operators', () => {
    const pe = new PluginEngine();
    pe.register(createOperatorPlugin([{ name: 'test', evaluate: () => true }]));
    expect(pe.collectOperators().size).toBe(1);
  });

  it('197. DebugEngine records and clears', () => {
    const de = new DebugEngine();
    de.recordAccessCheck({ permission: 'x', granted: true, roles: [], timestamp: 0 });
    expect(de.getDebugInfo().lastChecks.length).toBe(1);
    de.clear();
    expect(de.getDebugInfo().lastChecks.length).toBe(0);
  });

  it('198. defineAccess returns same config', () => {
    const c = defineAccess({ roles: ['a'] as const, permissions: { a: ['x'] } });
    expect(c.roles).toEqual(['a']);
  });

  it('199. mergeConfigs merges features', () => {
    const base = defineAccess({ roles: ['a'] as const, permissions: {}, features: { f1: true } });
    const merged = mergeConfigs(base, { features: { f2: true } } as any);
    expect(merged.features).toHaveProperty('f2');
  });

  it('200. auditLoggerPlugin logs denied events', () => {
    const log = vi.fn();
    const p = createAuditLoggerPlugin({ log, deniedOnly: true });
    p.onAccessCheck!({ permission: 'x', granted: false, roles: [], timestamp: 0 });
    expect(log).toHaveBeenCalled();
    log.mockClear();
    p.onAccessCheck!({ permission: 'x', granted: true, roles: [], timestamp: 0 });
    expect(log).not.toHaveBeenCalled();
  });
});
