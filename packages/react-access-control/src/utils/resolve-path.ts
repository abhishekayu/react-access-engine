// ---------------------------------------------------------------------------
// Deep path resolution utility
// ---------------------------------------------------------------------------
// Resolves nested property paths like 'user.org.role', 'env.region'
// from arbitrary objects. Used by the policy condition operator system.
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-separated path on an object.
 *
 * @example
 * ```ts
 * resolvePath({ a: { b: { c: 42 } } }, 'a.b.c') // 42
 * resolvePath({ x: [1, 2] }, 'x.1')              // 2
 * resolvePath({}, 'a.b')                          // undefined
 * ```
 */
export function resolvePath(obj: unknown, path: string): unknown {
  if (obj == null || path === '') return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
