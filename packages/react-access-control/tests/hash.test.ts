import { describe, it, expect } from 'vitest';
import { hashUserId } from '../src/utils/hash';

describe('hashUserId', () => {
  it('returns a non-negative integer', () => {
    const hash = hashUserId('user-1', 'feature-a');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hash)).toBe(true);
  });

  it('is deterministic', () => {
    const h1 = hashUserId('user-1', 'seed');
    const h2 = hashUserId('user-1', 'seed');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different inputs', () => {
    const h1 = hashUserId('user-1', 'seed');
    const h2 = hashUserId('user-2', 'seed');
    const h3 = hashUserId('user-1', 'other-seed');
    expect(h1).not.toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it('distributes somewhat evenly across buckets', () => {
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 1000; i++) {
      const hash = hashUserId(`user-${i}`, 'test');
      buckets[hash % 10]!++;
    }
    // Each bucket should have at least some entries (rough distribution check)
    for (const count of buckets) {
      expect(count).toBeGreaterThan(20);
    }
  });
});
