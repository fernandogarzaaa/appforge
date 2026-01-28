/**
 * Advanced Permissions System
 * Handles fine-grained access control, role-based permissions, and resource-level access
 * 
 * @typedef {Object} Permission
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} resource
 * @property {string} action
 * @property {Date} createdAt
 * 
 * @typedef {Object} Role
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string[]} permissions
 * @property {boolean} isCustom
 * @property {Date} createdAt
 * 
 * @typedef {Object} ResourceAccess
 * @property {string} resourceId
 * @property {string} resourceType
 * @property {string} principal
 * @property {'user'|'team'|'role'} principalType
 * @property {'owner'|'editor'|'viewer'|'none'} accessLevel
 * @property {Date} grantedAt
 * @property {string} grantedBy
 * @property {string[]} [customPermissions]
 */

const permissionStore = new Map();
const roleStore = new Map();
const resourcePermissions = new Map();
const permissionListeners = new Map();

// Initialize default roles
const initializeDefaultRoles = () => {
  const defaultRoles = [
    {
      id: 'role_owner',
      name: 'Owner',
      description: 'Full access to all resources',
      permissions: getAllPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
    {
      id: 'role_admin',
      name: 'Administrator',
      description: 'Administrative access with limited control',
      permissions: getAdminPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
    {
      id: 'role_editor',
      name: 'Editor',
      description: 'Can create and edit resources',
      permissions: getEditorPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
    {
      id: 'role_viewer',
      name: 'Viewer',
      description: 'Read-only access',
      permissions: getViewerPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
  ];

  defaultRoles.forEach(role => {
    roleStore.set(role.id, role);
  });
};

/**
 * Create custom role
 */
export const createCustomRole = (name, description, permissions) => {
  const roleId = `role_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const role = {
    id: roleId,
    name,
    description,
    permissions,
    isCustom: true,
    createdAt: new Date(),
  };

  roleStore.set(roleId, role);
  notifyPermissionListeners('role_created', role);
  
  return role;
};

/**
 * Update role permissions
 */
export const updateRolePermissions = (roleId, permissions) => {
  const role = roleStore.get(roleId);
  if (!role) throw new Error('Role not found');
  
  if (!role.isCustom) {
    throw new Error('Cannot modify built-in roles');
  }

  role.permissions = permissions;
  notifyPermissionListeners('role_updated', role);
  
  return role;
};

/**
 * Grant resource access
 */
export const grantResourceAccess = (
  resourceId,
  resourceType,
  principal,
  principalType,
  accessLevel,
  customPermissions = []
) => {
  const key = `${resourceId}:${principal}`;
  
  const access = {
    resourceId,
    resourceType,
    principal,
    principalType,
    accessLevel,
    grantedAt: new Date(),
    grantedBy: getCurrentUserId(),
    customPermissions,
  };

  if (!resourcePermissions.has(resourceId)) {
    resourcePermissions.set(resourceId, new Map());
  }

  resourcePermissions.get(resourceId).set(principal, access);
  notifyPermissionListeners('access_granted', access);
  
  return access;
};

/**
 * Revoke resource access
 */
export const revokeResourceAccess = (resourceId, principal) => {
  const resourceMap = resourcePermissions.get(resourceId);
  if (!resourceMap) return null;

  const access = resourceMap.get(principal);
  resourceMap.delete(principal);
  
  notifyPermissionListeners('access_revoked', { resourceId, principal });
  
  return access;
};

/**
 * Check resource access
 */
export const checkResourceAccess = (
  resourceId,
  principal,
  requiredAccessLevel
) => {
  const resourceMap = resourcePermissions.get(resourceId);
  if (!resourceMap) return false;

  const access = resourceMap.get(principal);
  if (!access) return false;

  const levels = ['none', 'viewer', 'editor', 'owner'];
  const requiredIndex = levels.indexOf(requiredAccessLevel);
  const currentIndex = levels.indexOf(access.accessLevel);

  return currentIndex >= requiredIndex;
};

/**
 * Get resource access
 */
export const getResourceAccess = (resourceId, principal) => {
  const resourceMap = resourcePermissions.get(resourceId);
  if (!resourceMap) return null;
  return resourceMap.get(principal);
};

/**
 * Get all resource access
 */
export const getResourceAccessList = (resourceId) => {
  const resourceMap = resourcePermissions.get(resourceId);
  if (!resourceMap) return [];
  return Array.from(resourceMap.values());
};

/**
 * Check permission
 */
export const hasPermission = (principal, permission) => {
  // Check if principal has the permission directly
  const userPermissions = permissionStore.get(principal);
  if (userPermissions && userPermissions.includes(permission)) {
    return true;
  }

  // Check user's roles
  const userRoles = getUserRoles(principal);
  for (const roleId of userRoles) {
    const role = roleStore.get(roleId);
    if (role && role.permissions.includes(permission)) {
      return true;
    }
  }

  return false;
};

/**
 * Grant permission to principal
 */
export const grantPermission = (principal, permission) => {
  if (!permissionStore.has(principal)) {
    permissionStore.set(principal, []);
  }

  const permissions = permissionStore.get(principal);
  if (!permissions.includes(permission)) {
    permissions.push(permission);
    notifyPermissionListeners('permission_granted', { principal, permission });
  }
};

/**
 * Revoke permission from principal
 */
export const revokePermission = (principal, permission) => {
  const permissions = permissionStore.get(principal);
  if (!permissions) return;

  const index = permissions.indexOf(permission);
  if (index > -1) {
    permissions.splice(index, 1);
    notifyPermissionListeners('permission_revoked', { principal, permission });
  }
};

/**
 * Assign role to principal
 */
export const assignRole = (principal, roleId) => {
  const role = roleStore.get(roleId);
  if (!role) throw new Error('Role not found');

  if (!permissionStore.has(principal)) {
    permissionStore.set(principal, []);
  }

  // Add all role permissions to principal
  const permissions = permissionStore.get(principal);
  role.permissions.forEach(perm => {
    if (!permissions.includes(perm)) {
      permissions.push(perm);
    }
  });

  notifyPermissionListeners('role_assigned', { principal, roleId });
};

/**
 * Get user roles
 */
export const getUserRoles = (userId) => {
  // This would be implemented based on your system
  // For now, returning empty array
  return [];
};

/**
 * Get role
 */
export const getRole = (roleId) => {
  return roleStore.get(roleId);
};

/**
 * List all roles
 */
export const listRoles = () => {
  return Array.from(roleStore.values());
};

/**
 * Subscribe to permission events
 */
export const onPermissionEvent = (eventType, callback) => {
  if (!permissionListeners.has(eventType)) {
    permissionListeners.set(eventType, []);
  }
  permissionListeners.get(eventType).push(callback);

  return () => {
    const callbacks = permissionListeners.get(eventType);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  };
};

/**
 * Get all available permissions
 */
function getAllPermissions() {
  return [
    'manage_team',
    'manage_members',
    'manage_projects',
    'manage_settings',
    'manage_billing',
    'manage_webhooks',
    'manage_integrations',
    'delete_team',
    'delete_projects',
    'create_projects',
    'edit_projects',
    'view_projects',
    'invite_members',
    'remove_members',
    'change_roles',
    'access_analytics',
    'export_data',
    'import_data',
    'manage_api_keys',
    'view_logs',
  ];
}

/**
 * Get admin permissions
 */
function getAdminPermissions() {
  return [
    'manage_projects',
    'manage_members',
    'manage_webhooks',
    'create_projects',
    'edit_projects',
    'view_projects',
    'invite_members',
    'remove_members',
    'access_analytics',
    'manage_api_keys',
    'view_logs',
  ];
}

/**
 * Get editor permissions
 */
function getEditorPermissions() {
  return [
    'create_projects',
    'edit_projects',
    'view_projects',
    'access_analytics',
  ];
}

/**
 * Get viewer permissions
 */
function getViewerPermissions() {
  return [
    'view_projects',
    'access_analytics',
  ];
}

/**
 * Notify permission listeners
 */
function notifyPermissionListeners(eventType, data) {
  const listeners = permissionListeners.get(eventType) || [];
  listeners.forEach(callback => callback(data));
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  return localStorage.getItem('userId') || 'user_' + Date.now();
}

// Initialize default roles on load
initializeDefaultRoles();

export default {
  createCustomRole,
  updateRolePermissions,
  grantResourceAccess,
  revokeResourceAccess,
  checkResourceAccess,
  getResourceAccess,
  getResourceAccessList,
  hasPermission,
  grantPermission,
  revokePermission,
  assignRole,
  getUserRoles,
  getRole,
  listRoles,
  onPermissionEvent,
};
