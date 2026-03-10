import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../src/engines/permission-engine';
import type { UserContext, AccessConfig } from '../src/types';

const config: Pick<AccessConfig<'admin' | 'editor' | 'viewer', string>, 'permissions'> = {
  permissions: {
    admin: ['*'],
    editor: ['articles:read', 'articles:write', 'comments:*'],
    viewer: ['articles:read'],
  },
};

describe('Permission Engine', () => {
  describe('hasPermission', () => {
    it('grants via wildcard (*)', () => {
      const admin: UserContext<'admin'> = { id: 'u1', roles: ['admin'] };
      expect(hasPermission(admin, 'anything:here', config)).toBe(true);
    });

    it('grants exact match', () => {
      const editor: UserContext<'editor'> = { id: 'u2', roles: ['editor'] };
      expect(hasPermission(editor, 'articles:read', config)).toBe(true);
      expect(hasPermission(editor, 'articles:write', config)).toBe(true);
    });

    it('grants namespace wildcard', () => {
      const editor: UserContext<'editor'> = { id: 'u2', roles: ['editor'] };
      expect(hasPermission(editor, 'comments:create', config)).toBe(true);
      expect(hasPermission(editor, 'comments:delete', config)).toBe(true);
    });

    it('denies when no matching permission', () => {
      const viewer: UserContext<'viewer'> = { id: 'u3', roles: ['viewer'] };
      expect(hasPermission(viewer, 'articles:write', config)).toBe(false);
      expect(hasPermission(viewer, 'billing:read', config)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission matches', () => {
      const viewer: UserContext<'viewer'> = { id: 'u3', roles: ['viewer'] };
      expect(hasAnyPermission(viewer, ['articles:read', 'articles:write'], config)).toBe(true);
    });

    it('returns false when no permissions match', () => {
      const viewer: UserContext<'viewer'> = { id: 'u3', roles: ['viewer'] };
      expect(hasAnyPermission(viewer, ['billing:read', 'billing:write'], config)).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when all permissions match', () => {
      const editor: UserContext<'editor'> = { id: 'u2', roles: ['editor'] };
      expect(hasAllPermissions(editor, ['articles:read', 'articles:write'], config)).toBe(true);
    });

    it('returns false when not all permissions match', () => {
      const viewer: UserContext<'viewer'> = { id: 'u3', roles: ['viewer'] };
      expect(hasAllPermissions(viewer, ['articles:read', 'articles:write'], config)).toBe(false);
    });
  });
});
