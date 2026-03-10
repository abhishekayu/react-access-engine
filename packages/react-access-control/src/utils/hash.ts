// ---------------------------------------------------------------------------
// Deterministic hash utility
// ---------------------------------------------------------------------------
// Uses a simple string hash (djb2-like) to produce a stable numeric bucket
// from a user ID + seed. This is SSR-safe (no Math.random, no crypto needed).
// ---------------------------------------------------------------------------

/**
 * Produce a deterministic non-negative integer hash from a user ID and seed.
 * Used for percentage-based rollouts and experiment assignment.
 */
export function hashUserId(userId: string, seed: string): number {
  const str = `${userId}:${seed}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + char
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
