// ---------------------------------------------------------------------------
// Condition Engine
// ---------------------------------------------------------------------------
// Evaluates declarative condition trees (AND/OR groups, operators) against
// a context object. Used by the policy engine, feature segment targeting,
// and experiment targeting.
// ---------------------------------------------------------------------------

import type {
  ConditionEntry,
  ConditionCheck,
  ConditionGroupAnd,
  ConditionGroupOr,
  ConditionOperator,
  CustomOperator,
} from '../types';
import { resolvePath } from '../utils/resolve-path';

// Type guards
function isAndGroup(entry: ConditionEntry): entry is ConditionGroupAnd {
  return 'and' in entry;
}

function isOrGroup(entry: ConditionEntry): entry is ConditionGroupOr {
  return 'or' in entry;
}

// ---------------------------------------------------------------------------
// Built-in operator implementations
// ---------------------------------------------------------------------------

const builtinOperators: Record<
  ConditionOperator,
  (fieldValue: unknown, conditionValue: unknown) => boolean
> = {
  equals: (a, b) => a === b,
  notEquals: (a, b) => a !== b,
  in: (a, b) => Array.isArray(b) && b.includes(a),
  notIn: (a, b) => Array.isArray(b) && !b.includes(a),
  includes: (a, b) => Array.isArray(a) && a.includes(b),
  greaterThan: (a, b) => typeof a === 'number' && typeof b === 'number' && a > b,
  lessThan: (a, b) => typeof a === 'number' && typeof b === 'number' && a < b,
  greaterThanOrEqual: (a, b) => typeof a === 'number' && typeof b === 'number' && a >= b,
  lessThanOrEqual: (a, b) => typeof a === 'number' && typeof b === 'number' && a <= b,
  exists: (a) => a !== undefined && a !== null,
};

/**
 * Evaluate a single condition check against a context object.
 */
function evaluateCheck(
  check: ConditionCheck,
  context: Record<string, unknown>,
  customOperators?: ReadonlyMap<string, CustomOperator>,
): boolean {
  const fieldValue = resolvePath(context, check.field);

  // Look up built-in first, then custom
  const builtin = builtinOperators[check.operator as ConditionOperator];
  if (builtin) {
    return builtin(fieldValue, check.value);
  }

  // Try custom operator
  if (customOperators) {
    const custom = customOperators.get(check.operator);
    if (custom) {
      return custom.evaluate(fieldValue, check.value);
    }
  }

  // Unknown operator — fail closed
  return false;
}

/**
 * Evaluate a condition entry (single check, AND group, or OR group)
 * against a context object.
 *
 * @param context - A flat namespace object. Typically built as:
 *   `{ user: { id, roles, plan, attributes }, resource: { ... }, env: { ... } }`
 * @param customOperators - Optional map of custom operator name → implementation.
 */
export function evaluateCondition(
  entry: ConditionEntry,
  context: Record<string, unknown>,
  customOperators?: ReadonlyMap<string, CustomOperator>,
): boolean {
  if (isAndGroup(entry)) {
    return entry.and.every((child) => evaluateCondition(child, context, customOperators));
  }
  if (isOrGroup(entry)) {
    return entry.or.some((child) => evaluateCondition(child, context, customOperators));
  }
  return evaluateCheck(entry as ConditionCheck, context, customOperators);
}

/**
 * Evaluate an array of condition entries as an implicit AND group.
 */
export function evaluateConditions(
  conditions: readonly ConditionEntry[],
  context: Record<string, unknown>,
  customOperators?: ReadonlyMap<string, CustomOperator>,
): boolean {
  return conditions.every((entry) => evaluateCondition(entry, context, customOperators));
}

/**
 * Build the standard condition context from user, resource, and environment.
 */
export function buildConditionContext(
  user: Record<string, unknown>,
  resource?: Record<string, unknown>,
  env?: Record<string, unknown>,
): Record<string, unknown> {
  return { user, resource: resource ?? {}, env: env ?? {} };
}
