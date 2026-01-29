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
const roleAssignments = new Map();
const INIT_KEY = 'appforge:advancedPermissions:init';

// Initialize default roles
const initializeDefaultRoles = () => {
  const defaultRoles = [
    {
      id: 'role_owner',
      name: 'owner',
      description: 'Full access to all resources',
      permissions: getAllPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
    {
      id: 'role_admin',
      name: 'admin',
      description: 'Administrative access with limited control',
      permissions: getAdminPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
    {
      id: 'role_editor',
      name: 'editor',
      description: 'Can create and edit resources',
      permissions: getEditorPermissions(),
      isCustom: false,
      createdAt: new Date(),
    },
    {
      id: 'role_viewer',
      name: 'viewer',
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

const ensureInitialized = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!localStorage.getItem(INIT_KEY)) {
      permissionStore.clear();
      roleStore.clear();
      resourcePermissions.clear();
      permissionListeners.clear();
      roleAssignments.clear();
      initializeDefaultRoles();
      localStorage.setItem(INIT_KEY, 'true');
    }
  } catch (error) {
    // Ignore storage errors (e.g., SSR)
  }
};

const getPrincipalKey = (principalId, principalType = 'user') => {
  return `${principalType}:${principalId}`;
};

/**
 * Create custom role
 */
export const createCustomRole = (name, description, permissions) => {
  ensureInitialized();
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
  ensureInitialized();
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
  ensureInitialized();
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
  ensureInitialized();
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
  ensureInitialized();
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
  ensureInitialized();
  const resourceMap = resourcePermissions.get(resourceId);
  if (!resourceMap) return null;
  return resourceMap.get(principal) || null;
};

/**
 * Get all resource access
 */
export const getResourceAccessList = (resourceId) => {
  ensureInitialized();
  const resourceMap = resourcePermissions.get(resourceId);
  if (!resourceMap) return [];
  return Array.from(resourceMap.values());
};

/**
 * Check permission
 */
export const hasPermission = (principal, permission) => {
  ensureInitialized();
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
  ensureInitialized();
  if (!permissionStore.has(principal)) {
    permissionStore.set(principal, []);
  }

  const permissions = permissionStore.get(principal);
  if (!permissions.includes(permission)) {
    permissions.push(permission);
    notifyPermissionListeners('permission_granted', { principalId: principal, permission });
  }
};

/**
 * Revoke permission from principal
 */
export const revokePermission = (principal, permission) => {
  ensureInitialized();
  const permissions = permissionStore.get(principal);
  if (!permissions) return;

  const index = permissions.indexOf(permission);
  if (index > -1) {
    permissions.splice(index, 1);
    notifyPermissionListeners('permission_revoked', { principalId: principal, permission });
  }
};

/**
 * Assign role to principal
 */
export const assignRole = (principalId, principalTypeOrRoleId, roleId) => {
  ensureInitialized();
  let principalType = 'user';
  let resolvedRoleId = principalTypeOrRoleId;

  if (roleId !== undefined) {
    principalType = principalTypeOrRoleId;
    resolvedRoleId = roleId;
  }

  const role = roleStore.get(resolvedRoleId);
  if (!role) throw new Error('Role not found');

  if (!permissionStore.has(principalId)) {
    permissionStore.set(principalId, []);
  }

  // Add all role permissions to principal
  const permissions = permissionStore.get(principalId);
  role.permissions.forEach(perm => {
    if (!permissions.includes(perm)) {
      permissions.push(perm);
    }
  });

  const key = getPrincipalKey(principalId, principalType);
  if (!roleAssignments.has(key)) {
    roleAssignments.set(key, []);
  }
  const assigned = roleAssignments.get(key);
  if (!assigned.includes(resolvedRoleId)) {
    assigned.push(resolvedRoleId);
  }

  notifyPermissionListeners('role_assigned', { principalId, principalType, roleId: resolvedRoleId });
};

/**
 * Get user roles
 */
export const getUserRoles = (userId) => {
  ensureInitialized();
  const key = getPrincipalKey(userId, 'user');
  return roleAssignments.get(key) || [];
};

/**
 * Get role
 */
export const getRole = (roleId) => {
  ensureInitialized();
  return roleStore.get(roleId) || null;
};

/**
 * List all roles
 */
export const listRoles = () => {
  ensureInitialized();
  return Array.from(roleStore.values());
};

/**
 * Subscribe to permission events
 */
export const onPermissionEvent = (eventType, callback) => {
  ensureInitialized();
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
ensureInitialized();

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
