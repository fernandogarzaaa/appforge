/**
 * Admin Role-Based Permission Matrix
 * Defines what each role can do in the system
 */

export const PERMISSIONS = {
  'super_admin': {
    // Key Management
    canManageKeys: true,
    canRotateKeys: true,
    canViewKeyAudit: true,
    
    // Secrets Management
    canManageSecrets: true,
    canRotateSecrets: true,
    canViewSecretAudit: true,
    
    // User Management
    canManageUsers: true,
    canInviteUsers: true,
    canRemoveUsers: true,
    canEditUserRoles: true,
    
    // Project Management
    canManageProjects: true,
    canDeleteProjects: true,
    canTransferProjects: true,
    
    // Audit & Compliance
    canViewAudit: true,
    canExportAudit: true,
    canPurgeOldAudit: true,
    
    // Billing
    canChangeBilling: true,
    canViewBilling: true,
    canEditBillingPlans: true,
    
    // System Management
    canManageSystem: true,
    canViewSystemHealth: true,
    canAccessSystemLogs: true,
    canManageSystemSettings: true,
    
    // Admin Dashboard
    canAccessAdminDashboard: true,
    canViewAnalytics: true,
    canManagePolicies: true,
  },
  
  'admin': {
    // Key Management
    canManageKeys: true,
    canRotateKeys: true,
    canViewKeyAudit: true,
    
    // Secrets Management
    canManageSecrets: true,
    canRotateSecrets: true,
    canViewSecretAudit: true,
    
    // User Management
    canManageUsers: true,
    canInviteUsers: true,
    canRemoveUsers: false, // Can't remove, only super_admin can
    canEditUserRoles: false, // Can't change roles
    
    // Project Management
    canManageProjects: true,
    canDeleteProjects: false,
    canTransferProjects: false,
    
    // Audit & Compliance
    canViewAudit: true,
    canExportAudit: true,
    canPurgeOldAudit: false, // Only super_admin
    
    // Billing
    canChangeBilling: false, // Only super_admin
    canViewBilling: true,
    canEditBillingPlans: false,
    
    // System Management
    canManageSystem: false,
    canViewSystemHealth: true,
    canAccessSystemLogs: false,
    canManageSystemSettings: false,
    
    // Admin Dashboard
    canAccessAdminDashboard: true,
    canViewAnalytics: true,
    canManagePolicies: false,
  },
  
  'operator': {
    // Key Management
    canManageKeys: true,
    canRotateKeys: false,
    canViewKeyAudit: true,
    
    // Secrets Management
    canManageSecrets: false,
    canRotateSecrets: false,
    canViewSecretAudit: false,
    
    // User Management
    canManageUsers: false,
    canInviteUsers: false,
    canRemoveUsers: false,
    canEditUserRoles: false,
    
    // Project Management
    canManageProjects: false,
    canDeleteProjects: false,
    canTransferProjects: false,
    
    // Audit & Compliance
    canViewAudit: true,
    canExportAudit: false,
    canPurgeOldAudit: false,
    
    // Billing
    canChangeBilling: false,
    canViewBilling: false,
    canEditBillingPlans: false,
    
    // System Management
    canManageSystem: false,
    canViewSystemHealth: true,
    canAccessSystemLogs: false,
    canManageSystemSettings: false,
    
    // Admin Dashboard
    canAccessAdminDashboard: false,
    canViewAnalytics: false,
    canManagePolicies: false,
  },
  
  'user': {
    // Regular users have minimal permissions
    canManageKeys: false,
    canRotateKeys: false,
    canViewKeyAudit: false,
    canManageSecrets: false,
    canRotateSecrets: false,
    canViewSecretAudit: false,
    canManageUsers: false,
    canInviteUsers: false,
    canRemoveUsers: false,
    canEditUserRoles: false,
    canManageProjects: false,
    canDeleteProjects: false,
    canTransferProjects: false,
    canViewAudit: false,
    canExportAudit: false,
    canPurgeOldAudit: false,
    canChangeBilling: false,
    canViewBilling: false,
    canEditBillingPlans: false,
    canManageSystem: false,
    canViewSystemHealth: false,
    canAccessSystemLogs: false,
    canManageSystemSettings: false,
    canAccessAdminDashboard: false,
    canViewAnalytics: false,
    canManagePolicies: false,
  }
};

/**
 * Check if a specific role has a permission
 * @param {string} role - The user role
 * @param {string} permission - The permission to check
 * @returns {boolean} Whether the role has the permission
 */
export function checkPermission(role, permission) {
  if (!PERMISSIONS[role]) {
    console.warn(`Unknown role: ${role}`);
    return false;
  }
  return PERMISSIONS[role][permission] || false;
}

/**
 * Get all permissions for a role
 * @param {string} role - The user role
 * @returns {object} Object containing all permissions for the role
 */
export function getPermissionsForRole(role) {
  return PERMISSIONS[role] || PERMISSIONS['user'];
}

/**
 * Check if a role is admin-level
 * @param {string} role - The user role
 * @returns {boolean} Whether the role is admin or higher
 */
export function isAdminRole(role) {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Check if a role is super admin
 * @param {string} role - The user role
 * @returns {boolean} Whether the role is super_admin
 */
export function isSuperAdminRole(role) {
  return role === 'super_admin';
}

/**
 * Get role hierarchy level (higher = more permissions)
 * @param {string} role - The user role
 * @returns {number} Hierarchy level
 */
export function getRoleHierarchyLevel(role) {
  const hierarchy = {
    'super_admin': 4,
    'admin': 3,
    'operator': 2,
    'user': 1
  };
  return hierarchy[role] || 0;
}

/**
 * Check if one role can manage another role
 * @param {string} managerRole - The manager's role
 * @param {string} targetRole - The target role to manage
 * @returns {boolean} Whether the manager can manage the target
 */
export function canManageRole(managerRole, targetRole) {
  const managerLevel = getRoleHierarchyLevel(managerRole);
  const targetLevel = getRoleHierarchyLevel(targetRole);
  return managerLevel > targetLevel;
}
