import { useState, useCallback } from 'react';

/**
 * Hook for role-based access control
 * @returns {Object} RBAC utilities
 */
export const useRoleBasedAccess = () => {
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Administrator', permissions: ['*'] },
    { id: 'editor', name: 'Editor', permissions: ['read', 'write', 'publish'] },
    { id: 'viewer', name: 'Viewer', permissions: ['read'] },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((userRole, permission) => {
    const role = roles.find(r => r.id === userRole);
    if (!role) return false;
    
    return role.permissions.includes('*') || role.permissions.includes(permission);
  }, [roles]);

  /**
   * Create custom role
   */
  const createRole = useCallback(async (roleData) => {
    setLoading(true);
    setError(null);

    try {
      const newRole = {
        id: `role-${Date.now()}`,
        ...roleData,
        createdAt: new Date().toISOString(),
      };

      setRoles(prev => [...prev, newRole]);
      return newRole;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update role permissions
   */
  const updateRole = useCallback(async (roleId, updates) => {
    setLoading(true);
    setError(null);

    try {
      setRoles(prev =>
        prev.map(role => (role.id === roleId ? { ...role, ...updates } : role))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete role
   */
  const deleteRole = useCallback(async (roleId) => {
    setLoading(true);
    setError(null);

    try {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get available permissions
   */
  const getAvailablePermissions = useCallback(() => {
    return [
      { id: 'read', name: 'Read', description: 'View content' },
      { id: 'write', name: 'Write', description: 'Create and edit content' },
      { id: 'delete', name: 'Delete', description: 'Delete content' },
      { id: 'publish', name: 'Publish', description: 'Publish content' },
      { id: 'manage_users', name: 'Manage Users', description: 'Add/remove users' },
      { id: 'manage_settings', name: 'Manage Settings', description: 'Configure system settings' },
      { id: 'manage_billing', name: 'Manage Billing', description: 'Handle billing and payments' },
      { id: '*', name: 'All Permissions', description: 'Full system access' },
    ];
  }, []);

  return {
    roles,
    loading,
    error,
    hasPermission,
    createRole,
    updateRole,
    deleteRole,
    getAvailablePermissions,
  };
};
