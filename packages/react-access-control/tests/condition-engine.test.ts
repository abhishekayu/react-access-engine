import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateConditions,
  buildConditionContext,
} from '../src/engines/condition-engine';
import type { ConditionCheck, ConditionEntry, CustomOperator } from '../src/types';

// ---------------------------------------------------------------------------
// Built-in operators
// ---------------------------------------------------------------------------

describe('Condition Engine — operators', () => {
  const ctx = { user: { id: 'u1', plan: 'pro', age: 30 }, resource: { ownerId: 'u1' } };

  it('equals: matches identical values', () => {
    expect(evaluateCondition({ field: 'user.id', operator: 'equals', value: 'u1' }, ctx)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'user.id', operator: 'equals', value: 'u2' }, ctx)).toBe(
      false,
    );
  });

  it('notEquals: passes when values differ', () => {
    expect(evaluateCondition({ field: 'user.id', operator: 'notEquals', value: 'u2' }, ctx)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'user.id', operator: 'notEquals', value: 'u1' }, ctx)).toBe(
      false,
    );
  });

  it('in: field value is inside the given array', () => {
    expect(
      evaluateCondition({ field: 'user.plan', operator: 'in', value: ['free', 'pro'] }, ctx),
    ).toBe(true);
    expect(
      evaluateCondition({ field: 'user.plan', operator: 'in', value: ['enterprise'] }, ctx),
    ).toBe(false);
  });

  it('notIn: field value is NOT inside the given array', () => {
    expect(
      evaluateCondition({ field: 'user.plan', operator: 'notIn', value: ['enterprise'] }, ctx),
    ).toBe(true);
    expect(evaluateCondition({ field: 'user.plan', operator: 'notIn', value: ['pro'] }, ctx)).toBe(
      false,
    );
  });

  it('includes: array field contains the value', () => {
    const arrCtx = { tags: ['a', 'b', 'c'] };
    expect(evaluateCondition({ field: 'tags', operator: 'includes', value: 'b' }, arrCtx)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'tags', operator: 'includes', value: 'z' }, arrCtx)).toBe(
      false,
    );
  });

  it('greaterThan / lessThan', () => {
    expect(evaluateCondition({ field: 'user.age', operator: 'greaterThan', value: 18 }, ctx)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'user.age', operator: 'greaterThan', value: 30 }, ctx)).toBe(
      false,
    );
    expect(evaluateCondition({ field: 'user.age', operator: 'lessThan', value: 40 }, ctx)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'user.age', operator: 'lessThan', value: 30 }, ctx)).toBe(
      false,
    );
  });

  it('greaterThanOrEqual / lessThanOrEqual', () => {
    expect(
      evaluateCondition({ field: 'user.age', operator: 'greaterThanOrEqual', value: 30 }, ctx),
    ).toBe(true);
    expect(
      evaluateCondition({ field: 'user.age', operator: 'greaterThanOrEqual', value: 31 }, ctx),
    ).toBe(false);
    expect(
      evaluateCondition({ field: 'user.age', operator: 'lessThanOrEqual', value: 30 }, ctx),
    ).toBe(true);
    expect(
      evaluateCondition({ field: 'user.age', operator: 'lessThanOrEqual', value: 29 }, ctx),
    ).toBe(false);
  });

  it('exists: passes when field is defined and non-null', () => {
    expect(evaluateCondition({ field: 'user.id', operator: 'exists' }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'user.missing', operator: 'exists' }, ctx)).toBe(false);
  });

  it('unknown built-in operator fails closed (returns false)', () => {
    expect(
      evaluateCondition({ field: 'user.id', operator: 'banana' as any, value: 'u1' }, ctx),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AND / OR groups
// ---------------------------------------------------------------------------

describe('Condition Engine — groups', () => {
  const ctx = { user: { plan: 'pro', country: 'US' } };

  it('AND group: all children must pass', () => {
    const group: ConditionEntry = {
      and: [
        { field: 'user.plan', operator: 'equals', value: 'pro' },
        { field: 'user.country', operator: 'equals', value: 'US' },
      ],
    };
    expect(evaluateCondition(group, ctx)).toBe(true);
  });

  it('AND group: fails if any child fails', () => {
    const group: ConditionEntry = {
      and: [
        { field: 'user.plan', operator: 'equals', value: 'pro' },
        { field: 'user.country', operator: 'equals', value: 'UK' },
      ],
    };
    expect(evaluateCondition(group, ctx)).toBe(false);
  });

  it('OR group: passes if at least one child passes', () => {
    const group: ConditionEntry = {
      or: [
        { field: 'user.plan', operator: 'equals', value: 'enterprise' },
        { field: 'user.country', operator: 'equals', value: 'US' },
      ],
    };
    expect(evaluateCondition(group, ctx)).toBe(true);
  });

  it('OR group: fails if all children fail', () => {
    const group: ConditionEntry = {
      or: [
        { field: 'user.plan', operator: 'equals', value: 'enterprise' },
        { field: 'user.country', operator: 'equals', value: 'UK' },
      ],
    };
    expect(evaluateCondition(group, ctx)).toBe(false);
  });

  it('nested groups: AND within OR', () => {
    const group: ConditionEntry = {
      or: [
        {
          and: [
            { field: 'user.plan', operator: 'equals', value: 'enterprise' },
            { field: 'user.country', operator: 'equals', value: 'US' },
          ],
        },
        {
          and: [
            { field: 'user.plan', operator: 'equals', value: 'pro' },
            { field: 'user.country', operator: 'equals', value: 'US' },
          ],
        },
      ],
    };
    expect(evaluateCondition(group, ctx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// evaluateConditions (implicit AND of array)
// ---------------------------------------------------------------------------

describe('evaluateConditions', () => {
  it('treats an array of entries as implicit AND', () => {
    const ctx = { user: { id: 'u1', plan: 'pro' } };
    const conditions: ConditionEntry[] = [
      { field: 'user.id', operator: 'equals', value: 'u1' },
      { field: 'user.plan', operator: 'in', value: ['pro', 'enterprise'] },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  it('fails if any entry fails', () => {
    const ctx = { user: { id: 'u1', plan: 'free' } };
    const conditions: ConditionEntry[] = [
      { field: 'user.id', operator: 'equals', value: 'u1' },
      { field: 'user.plan', operator: 'in', value: ['pro', 'enterprise'] },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(false);
  });

  it('empty conditions array returns true', () => {
    expect(evaluateConditions([], {})).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Custom operators
// ---------------------------------------------------------------------------

describe('Condition Engine — custom operators', () => {
  it('uses a custom operator when available', () => {
    const startsWith: CustomOperator = {
      name: 'startsWith',
      evaluate: (val, prefix) => typeof val === 'string' && val.startsWith(String(prefix)),
    };
    const ops = new Map<string, CustomOperator>([['startsWith', startsWith]]);
    const ctx = { email: 'admin@corp.com' };
    const check: ConditionCheck = { field: 'email', operator: 'startsWith', value: 'admin' };
    expect(evaluateCondition(check, ctx, ops)).toBe(true);
    expect(evaluateCondition({ ...check, value: 'user' }, ctx, ops)).toBe(false);
  });

  it('built-in operator takes precedence over custom with same name', () => {
    const weirdEquals: CustomOperator = {
      name: 'equals',
      evaluate: () => false, // always false
    };
    const ops = new Map<string, CustomOperator>([['equals', weirdEquals]]);
    const ctx = { x: 1 };
    // Built-in equals should still work
    expect(evaluateCondition({ field: 'x', operator: 'equals', value: 1 }, ctx, ops)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildConditionContext
// ---------------------------------------------------------------------------

describe('buildConditionContext', () => {
  it('wraps user, resource, and env into a standard context object', () => {
    const result = buildConditionContext(
      { id: 'u1', roles: ['admin'] },
      { ownerId: 'u1' },
      { name: 'production' },
    );
    expect(result).toEqual({
      user: { id: 'u1', roles: ['admin'] },
      resource: { ownerId: 'u1' },
      env: { name: 'production' },
    });
  });

  it('defaults resource and env to empty objects', () => {
    const result = buildConditionContext({ id: 'u1' });
    expect(result).toEqual({
      user: { id: 'u1' },
      resource: {},
      env: {},
    });
  });
});
