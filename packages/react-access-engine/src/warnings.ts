// ---------------------------------------------------------------------------
// Dev-only warning utilities
// ---------------------------------------------------------------------------
// These are tree-shaken in production builds. Bundlers like Vite, webpack,
// and esbuild replace `process.env.NODE_ENV` at build time.
// ---------------------------------------------------------------------------

declare const process: { env: Record<string, string | undefined> } | undefined;

const __DEV__ = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

const _warned = /* @__PURE__ */ new Set<string>();

/**
 * Log a warning in development. No-op in production.
 */
export function warn(message: string): void {
  if (__DEV__) {
    console.warn(`[react-access-engine] ${message}`);
  }
}

/**
 * Log a warning only once per unique message. Useful for warnings inside
 * render loops that would otherwise flood the console.
 */
export function warnOnce(message: string): void {
  if (__DEV__ && !_warned.has(message)) {
    _warned.add(message);
    console.warn(`[react-access-engine] ${message}`);
  }
}

/**
 * Throw an invariant error with a library-prefixed message.
 * Active in both development and production.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[react-access-engine] ${message}`);
  }
}
