// ---------------------------------------------------------------------------
// react-access-engine — Public API
// ---------------------------------------------------------------------------

// Config factory & utilities
export { defineAccess, mergeConfigs } from './types';

// Types
export type {
  AccessConfig,
  UserContext,
  EnvironmentContext,
  FeatureDefinition,
  ExperimentDefinition,
  PolicyRule,
  PermissionCondition,
  AccessPlugin,
  AccessCheckEvent,
  FeatureEvaluateEvent,
  PolicyEvaluateEvent,
  ExperimentAssignEvent,
  ConfigLoadEvent,
  RemoteConfigLoader,
  RemoteConfigState,
  AccessDebugInfo,
  AccessProviderProps,
  // Condition engine types
  ConditionOperator,
  ConditionCheck,
  ConditionGroupAnd,
  ConditionGroupOr,
  ConditionEntry,
  CustomOperator,
  RenderDeniedEvent,
  // Type inference helpers
  InferRoles,
  InferPermissions,
  InferFeatures,
  InferPlans,
  InferExperiments,
} from './types';

// Components
export {
  AccessProvider,
  Can,
  Feature,
  AccessGate,
  PermissionGuard,
  FeatureToggle,
  Experiment,
  Allow,
} from './components';
export type {
  CanProps,
  FeatureProps,
  AccessGateProps,
  PermissionGuardProps,
  FeatureToggleProps,
  ExperimentProps,
  AllowProps,
} from './components';

// Hooks
export {
  useAccess,
  usePermission,
  useRole,
  useFeature,
  usePolicy,
  useExperiment,
  useAccessDebug,
  usePlan,
  useRemoteConfig,
} from './hooks';
export type { UseRoleResult, UseFeatureResult, UsePolicyResult, UsePlanResult } from './hooks';

// Engine functions (usable on backend / Node.js without React)
export { hasRole, hasAnyRole, hasAllRoles, getPermissionsForUser } from './engines/role-engine';
export { hasPermission, hasAnyPermission, hasAllPermissions } from './engines/permission-engine';
export { evaluateFeature, evaluateAllFeatures } from './engines/feature-engine';
export { evaluatePolicy } from './engines/policy-engine';
export { assignExperiment } from './engines/experiment-engine';
export { hasPlanAccess, getPlanTier } from './engines/plan-engine';
export { PluginEngine } from './engines/plugin-engine';

// Engine types (for advanced users / plugin authors)
export type { FeatureEvalResult } from './engines/feature-engine';
export type { PolicyEvalResult } from './engines/policy-engine';
export type { ExperimentAssignment } from './engines/experiment-engine';
export { RemoteConfigEngine } from './engines/remote-config-engine';
export type { RemoteConfigEngineOptions } from './engines/remote-config-engine';

// Condition engine (for ABAC / declarative conditions)
export {
  evaluateCondition,
  evaluateConditions,
  buildConditionContext,
} from './engines/condition-engine';

// Debug engine types (for devtools integration)
export { DebugEngine } from './engines/debug-engine';
export type { DebugEvent, DebugEventType, DebugListener } from './engines/debug-engine';

// Context (for devtools / advanced integrations)
export { AccessContext } from './context';
export type { AccessContextValue } from './context';

// Plugin factories
export { createAuditLoggerPlugin, createAnalyticsPlugin, createOperatorPlugin } from './plugins';
