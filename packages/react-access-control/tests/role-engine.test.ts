import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getPermissionsForUser,
} from '../src/engines/role-engine';
import type { UserContext, AccessConfig } from '../src/types';

const user: UserContext<'admin' | 'editor' | 'viewer'> = {
  id: 'user-1',
  roles: ['admin', 'editor'],
};

const config: Pick<AccessConfig<'admin' | 'editor' | 'viewer', string>, 'permissions'> = {
  permissions: {
    admin: ['*'],
    editor: ['articles:read', 'articles:write'],
    viewer: ['articles:read'],
  },
};

describe('Role Engine', () => {
  describe('hasRole', () => {
    it('returns true when user has the role', () => {
      expect(hasRole(user, 'admin')).toBe(true);
      expect(hasRole(user, 'editor')).toBe(true);
    });

    it('returns false when user does not have the role', () => {
      expect(hasRole(user, 'viewer')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('returns true when user has at least one of the roles', () => {
      expect(hasAnyRole(user, ['admin', 'viewer'])).toBe(true);
      expect(hasAnyRole(user, ['viewer', 'editor'])).toBe(true);
    });

    it('returns false when user has none of the roles', () => {
      expect(hasAnyRole(user, ['viewer'])).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('returns true when user has all roles', () => {
      expect(hasAllRoles(user, ['admin', 'editor'])).toBe(true);
    });

    it('returns false when user is missing a role', () => {
      expect(hasAllRoles(user, ['admin', 'viewer'])).toBe(false);
    });
  });

  describe('getPermissionsForUser', () => {
    it('merges permissions from all roles', () => {
      const perms = getPermissionsForUser(user, config);
      expect(perms).toContain('*');
      expect(perms).toContain('articles:read');
      expect(perms).toContain('articles:write');
    });

    it('deduplicates permissions', () => {
      const multiRoleUser: UserContext<'editor' | 'viewer'> = {
        id: 'user-2',
        roles: ['editor', 'viewer'],
      };
      const perms = getPermissionsForUser(multiRoleUser, config);
      const readCount = perms.filter((p) => p === 'articles:read').length;
      expect(readCount).toBe(1);
    });
  });
});
