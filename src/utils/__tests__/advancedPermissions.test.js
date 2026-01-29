import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as perms from '@/utils/advancedPermissions';

describe('Advanced Permissions System', () => {
  beforeEach(() => {
    // Clear state
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Roles', () => {
    it('should have owner role', () => {
      const roles = perms.listRoles();
      const owner = roles.find(r => r.name === 'owner');

      expect(owner).toBeDefined();
      expect(owner.permissions.length).toBeGreaterThan(0);
    });

    it('should have admin role', () => {
      const roles = perms.listRoles();
      const admin = roles.find(r => r.name === 'admin');

      expect(admin).toBeDefined();
    });

    it('should have editor role', () => {
      const roles = perms.listRoles();
      const editor = roles.find(r => r.name === 'editor');

      expect(editor).toBeDefined();
    });

    it('should have viewer role', () => {
      const roles = perms.listRoles();
      const viewer = roles.find(r => r.name === 'viewer');

      expect(viewer).toBeDefined();
    });

    it('owner should have more permissions than admin', () => {
      const roles = perms.listRoles();
      const owner = roles.find(r => r.name === 'owner');
      const admin = roles.find(r => r.name === 'admin');

      expect(owner.permissions.length).toBeGreaterThanOrEqual(admin.permissions.length);
    });
  });

  describe('createCustomRole', () => {
    it('should create a custom role', () => {
      const role = perms.createCustomRole('Moderator', 'Content moderator', ['view_team', 'manage_team']);

      expect(role).toBeDefined();
      expect(role.name).toBe('Moderator');
      expect(role.description).toBe('Content moderator');
      expect(role.permissions).toContain('view_team');
    });

    it('should generate unique role IDs', () => {
      const role1 = perms.createCustomRole('Role 1', '', []);
      const role2 = perms.createCustomRole('Role 2', '', []);

      expect(role1.id).not.toBe(role2.id);
    });

    it('should support multiple permissions', () => {
      const permissions = ['manage_team', 'view_team', 'invite_members'];
      const role = perms.createCustomRole('Custom', '', permissions);

      expect(role.permissions).toEqual(permissions);
    });
  });

  describe('updateRolePermissions', () => {
    it('should add permissions to role', () => {
      const role = perms.createCustomRole('Test Role', '', ['view_team']);
      perms.updateRolePermissions(role.id, ['view_team', 'manage_team']);

      const updated = perms.getRole(role.id);
      expect(updated.permissions).toContain('manage_team');
      expect(updated.permissions).toContain('view_team');
    });

    it('should replace permissions', () => {
      const role = perms.createCustomRole('Test Role', '', ['view_team', 'manage_team']);
      perms.updateRolePermissions(role.id, ['view_team']);

      const updated = perms.getRole(role.id);
      expect(updated.permissions).toEqual(['view_team']);
    });
  });

  describe('grantResourceAccess', () => {
    it('should grant access to resource', () => {
      perms.grantResourceAccess('project-123', 'project', 'user-456', 'user', 'editor');

      const hasAccess = perms.checkResourceAccess('project-123', 'user-456', 'editor');
      expect(hasAccess).toBe(true);
    });

    it('should support different resource types', () => {
      const types = ['project', 'workspace', 'dataset'];

      types.forEach(type => {
        expect(() => {
          perms.grantResourceAccess(`resource-${type}`, type, 'user-1', 'user', 'editor');
        }).not.toThrow();
      });
    });

    it('should support different principal types', () => {
      const types = ['user', 'team', 'role'];

      types.forEach(type => {
        expect(() => {
          perms.grantResourceAccess('resource-1', 'project', `principal-${type}`, type, 'editor');
        }).not.toThrow();
      });
    });

    it('should support different access levels', () => {
      const levels = ['viewer', 'editor', 'owner'];

      levels.forEach(level => {
        expect(() => {
          perms.grantResourceAccess(`resource-${level}`, 'project', 'user-1', 'user', level);
        }).not.toThrow();
      });
    });
  });

  describe('checkResourceAccess', () => {
    it('should return true for granted access', () => {
      perms.grantResourceAccess('project-1', 'project', 'user-1', 'user', 'editor');

      expect(perms.checkResourceAccess('project-1', 'user-1', 'editor')).toBe(true);
    });

    it('should return false for ungranted access', () => {
      expect(perms.checkResourceAccess('project-1', 'user-1', 'owner')).toBe(false);
    });

    it('should not allow escalation', () => {
      perms.grantResourceAccess('project-1', 'project', 'user-1', 'user', 'viewer');

      // User cannot access as editor when only granted viewer
      expect(perms.checkResourceAccess('project-1', 'user-1', 'editor')).toBe(false);
    });

    it('should allow access levels below granted', () => {
      perms.grantResourceAccess('project-1', 'project', 'user-1', 'user', 'owner');

      // Owner can access as editor or viewer (hierarchical)
      expect(perms.checkResourceAccess('project-1', 'user-1', 'owner')).toBe(true);
    });
  });

  describe('revokeResourceAccess', () => {
    it('should revoke granted access', () => {
      perms.grantResourceAccess('project-1', 'project', 'user-1', 'user', 'editor');
      expect(perms.checkResourceAccess('project-1', 'user-1', 'editor')).toBe(true);

      perms.revokeResourceAccess('project-1', 'user-1');
      expect(perms.checkResourceAccess('project-1', 'user-1', 'editor')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should check if principal has permission', () => {
      const role = perms.createCustomRole('Test', '', ['manage_team', 'view_team']);
      perms.assignRole('user-1', 'user', role.id);

      expect(perms.hasPermission('user-1', 'manage_team')).toBe(true);
      expect(perms.hasPermission('user-1', 'view_team')).toBe(true);
    });

    it('should deny permission not in role', () => {
      const role = perms.createCustomRole('Limited', '', ['view_team']);
      perms.assignRole('user-1', 'user', role.id);

      expect(perms.hasPermission('user-1', 'manage_team')).toBe(false);
    });
  });

  describe('grantPermission', () => {
    it('should grant direct permission', () => {
      perms.grantPermission('user-1', 'view_analytics');

      expect(perms.hasPermission('user-1', 'view_analytics')).toBe(true);
    });

    it('should be independent of roles', () => {
      const role = perms.createCustomRole('NoAnalytics', '', ['view_team']);
      perms.assignRole('user-1', 'user', role.id);

      // Grant direct permission not in role
      perms.grantPermission('user-1', 'view_analytics');

      expect(perms.hasPermission('user-1', 'view_analytics')).toBe(true);
    });
  });

  describe('revokePermission', () => {
    it('should revoke direct permission', () => {
      perms.grantPermission('user-1', 'view_analytics');
      expect(perms.hasPermission('user-1', 'view_analytics')).toBe(true);

      perms.revokePermission('user-1', 'view_analytics');
      expect(perms.hasPermission('user-1', 'view_analytics')).toBe(false);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', () => {
      const role = perms.createCustomRole('Test', '', ['view_team']);
      perms.assignRole('user-1', 'user', role.id);

      expect(perms.hasPermission('user-1', 'view_team')).toBe(true);
    });

    it('should assign role to team', () => {
      const role = perms.createCustomRole('Test', '', ['manage_team']);
      expect(() => {
        perms.assignRole('team-1', 'team', role.id);
      }).not.toThrow();
    });

    it('should support role reassignment', () => {
      const role1 = perms.createCustomRole('Role1', '', ['view_team']);
      const role2 = perms.createCustomRole('Role2', '', ['manage_team']);

      perms.assignRole('user-1', 'user', role1.id);
      expect(perms.hasPermission('user-1', 'view_team')).toBe(true);

      perms.assignRole('user-1', 'user', role2.id);
      expect(perms.hasPermission('user-1', 'manage_team')).toBe(true);
    });
  });

  describe('listRoles', () => {
    it('should return all roles', () => {
      const before = perms.listRoles().length;
      perms.createCustomRole('New Role', '', []);

      const after = perms.listRoles().length;
      expect(after).toBeGreaterThan(before);
    });

    it('should include custom roles', () => {
      perms.createCustomRole('Custom Role', '', []);

      const roles = perms.listRoles();
      const found = roles.find(r => r.name === 'Custom Role');

      expect(found).toBeDefined();
    });

    it('should include default roles', () => {
      const roles = perms.listRoles();
      const defaultRoles = ['owner', 'admin', 'editor', 'viewer'];

      defaultRoles.forEach(name => {
        expect(roles.some(r => r.name === name)).toBe(true);
      });
    });
  });

  describe('getRole', () => {
    it('should retrieve role by ID', () => {
      const role = perms.createCustomRole('Test', 'Description', ['view_team']);
      const retrieved = perms.getRole(role.id);

      expect(retrieved.id).toBe(role.id);
      expect(retrieved.name).toBe('Test');
    });

    it('should return null for non-existent role', () => {
      const role = perms.getRole('non-existent-id');
      expect(role).toBeNull();
    });
  });

  describe('getResourceAccess', () => {
    it('should return access level', () => {
      perms.grantResourceAccess('project-1', 'project', 'user-1', 'user', 'editor');

      const access = perms.getResourceAccess('project-1', 'user-1');
      expect(access?.accessLevel).toBe('editor');
    });

    it('should return null for no access', () => {
      const access = perms.getResourceAccess('project-1', 'user-1');
      expect(access).toBeNull();
    });
  });

  describe('getResourceAccessList', () => {
    it('should list all access for resource', () => {
      perms.grantResourceAccess('project-1', 'project', 'user-1', 'user', 'editor');
      perms.grantResourceAccess('project-1', 'project', 'user-2', 'user', 'viewer');

      const access = perms.getResourceAccessList('project-1');
      expect(access.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Permission Events', () => {
    it('should emit permission granted event', async () => {
      await new Promise((resolve) => {
        const unsubscribe = perms.onPermissionEvent('permission_granted', (event) => {
          expect(event.principalId).toBeDefined();
          expect(event.permission).toBeDefined();
          unsubscribe();
          resolve();
        });

        perms.grantPermission('user-1', 'view_team');
      });
    });

    it('should emit role assigned event', async () => {
      const role = perms.createCustomRole('Test', '', []);

      await new Promise((resolve) => {
        const unsubscribe = perms.onPermissionEvent('role_assigned', (event) => {
          expect(event.principalId).toBeDefined();
          expect(event.roleId).toBeDefined();
          unsubscribe();
          resolve();
        });

        perms.assignRole('user-1', 'user', role.id);
      });
    });
  });
});
