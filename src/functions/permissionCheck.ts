import { base44 } from '@/api/base44Client';

const ROLE_PERMISSIONS = {
  admin: {
    view_dashboards: ['all'],
    manage_monitoring_rules: true,
    manage_alert_configurations: true,
    acknowledge_alerts: true,
    execute_automated_actions: true,
    view_business_impact: true,
    manage_integrations: true,
    manage_users: true,
    manage_playbooks: true,
    create_custom_reports: true,
    modify_system_settings: true,
    view_audit_logs: true,
    execute_preventative_actions: true,
    manage_scheduled_downtime: true,
    view_root_cause_analysis: true,
    max_alert_severity_can_view: 'all',
    accessible_data_sources: 'all'
  },
  operator: {
    view_dashboards: ['dashboard', 'alerts', 'automation'],
    manage_monitoring_rules: true,
    manage_alert_configurations: true,
    acknowledge_alerts: true,
    execute_automated_actions: true,
    view_business_impact: true,
    manage_integrations: false,
    manage_users: false,
    manage_playbooks: true,
    create_custom_reports: false,
    modify_system_settings: false,
    view_audit_logs: false,
    execute_preventative_actions: true,
    manage_scheduled_downtime: true,
    view_root_cause_analysis: true,
    max_alert_severity_can_view: 'all',
    accessible_data_sources: 'all'
  },
  analyst: {
    view_dashboards: ['dashboard', 'alerts', 'analytics', 'intelligence'],
    manage_monitoring_rules: false,
    manage_alert_configurations: false,
    acknowledge_alerts: true,
    execute_automated_actions: false,
    view_business_impact: true,
    manage_integrations: false,
    manage_users: false,
    manage_playbooks: false,
    create_custom_reports: true,
    modify_system_settings: false,
    view_audit_logs: false,
    execute_preventative_actions: false,
    manage_scheduled_downtime: false,
    view_root_cause_analysis: true,
    max_alert_severity_can_view: 'high_and_above',
    accessible_data_sources: 'all'
  },
  read_only: {
    view_dashboards: ['dashboard', 'analytics'],
    manage_monitoring_rules: false,
    manage_alert_configurations: false,
    acknowledge_alerts: false,
    execute_automated_actions: false,
    view_business_impact: false,
    manage_integrations: false,
    manage_users: false,
    manage_playbooks: false,
    create_custom_reports: false,
    modify_system_settings: false,
    view_audit_logs: false,
    execute_preventative_actions: false,
    manage_scheduled_downtime: false,
    view_root_cause_analysis: false,
    max_alert_severity_can_view: 'critical_only',
    accessible_data_sources: []
  }
};

export async function getUserRole(userEmail) {
  try {
    const permissions = await base44.entities.UserPermission.filter({ user_email: userEmail });
    if (permissions.length > 0) {
      return permissions[0].role_name;
    }
    return 'read_only';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'read_only';
  }
}

export async function checkPermission(userEmail, permission) {
  try {
    const role = await getUserRole(userEmail);
    const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.read_only;
    
    if (rolePerms[permission] === true) return true;
    if (rolePerms[permission] === false) return false;
    
    // Check for array-based permissions (like view_dashboards)
    if (Array.isArray(rolePerms[permission])) {
      return rolePerms[permission].length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function checkPermissions(userEmail, permissions) {
  try {
    const results = await Promise.all(
      permissions.map(perm => checkPermission(userEmail, perm))
    );
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return false;
  }
}

export async function canViewDashboard(userEmail, dashboardName) {
  try {
    const role = await getUserRole(userEmail);
    const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.read_only;
    
    const allowedDashboards = rolePerms.view_dashboards;
    if (allowedDashboards === 'all') return true;
    
    return Array.isArray(allowedDashboards) && allowedDashboards.includes(dashboardName);
  } catch (error) {
    console.error('Error checking dashboard access:', error);
    return false;
  }
}

export async function canAccessDataSource(userEmail, dataSourceId) {
  try {
    const permissions = await base44.entities.UserPermission.filter({ user_email: userEmail });
    
    if (permissions.length === 0) return false;
    
    const userPerms = permissions[0];
    
    // Check if restricted
    if (userPerms.restricted_data_sources?.includes(dataSourceId)) {
      return false;
    }
    
    // Check if allowed
    const role = await getUserRole(userEmail);
    const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.read_only;
    
    if (rolePerms.accessible_data_sources === 'all') return true;
    
    return Array.isArray(rolePerms.accessible_data_sources) && 
           rolePerms.accessible_data_sources.includes(dataSourceId);
  } catch (error) {
    console.error('Error checking data source access:', error);
    return false;
  }
}

export function getRolePermissions(roleName) {
  return ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS.read_only;
}

export const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'operator', label: 'Operator', description: 'Can manage rules and execute actions' },
  { value: 'analyst', label: 'Analyst', description: 'Can view and analyze data' },
  { value: 'read_only', label: 'Read-Only', description: 'View-only access' }
];