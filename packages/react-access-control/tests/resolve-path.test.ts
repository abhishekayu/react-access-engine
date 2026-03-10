import { describe, it, expect } from 'vitest';
import { resolvePath } from '../src/utils/resolve-path';

describe('resolvePath', () => {
  it('resolves top-level property', () => {
    expect(resolvePath({ name: 'Alice' }, 'name')).toBe('Alice');
  });

  it('resolves nested dot-path', () => {
    expect(resolvePath({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  it('returns undefined for missing path', () => {
    expect(resolvePath({ a: 1 }, 'b')).toBeUndefined();
  });

  it('returns undefined for missing intermediate', () => {
    expect(resolvePath({ a: 1 }, 'a.b.c')).toBeUndefined();
  });

  it('resolves array index via numeric string', () => {
    expect(resolvePath({ items: [10, 20, 30] }, 'items.1')).toBe(20);
  });

  it('returns undefined for null input', () => {
    expect(resolvePath(null, 'a')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(resolvePath(undefined, 'a')).toBeUndefined();
  });

  it('returns undefined for empty path', () => {
    expect(resolvePath({ a: 1 }, '')).toBeUndefined();
  });

  it('handles nested null', () => {
    expect(resolvePath({ a: { b: null } }, 'a.b.c')).toBeUndefined();
  });
});
