import { useState, useEffect, useCallback } from 'react';

/**
 * useAdminDashboard Hook
 * Manage admin settings, feature toggles, and system health
 */
export function useAdminDashboard() {
  const [adminSettings, setAdminSettings] = useState({
    appName: 'AppForge',
    version: '1.0.0',
    environment: 'production',
    maintenanceMode: false,
    debugMode: false
  });

  const [featureToggles, setFeatureToggles] = useState({});
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: 0,
    responseTime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    lastChecked: null
  });

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appforge_admin_settings');
    if (saved) setAdminSettings(JSON.parse(saved));

    const toggles = localStorage.getItem('appforge_feature_toggles');
    if (toggles) setFeatureToggles(JSON.parse(toggles));

    const savedLogs = localStorage.getItem('appforge_admin_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    const savedUsers = localStorage.getItem('appforge_admin_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
  }, []);

  // Update admin settings
  const updateSettings = useCallback((newSettings) => {
    const updated = { ...adminSettings, ...newSettings };
    setAdminSettings(updated);
    localStorage.setItem('appforge_admin_settings', JSON.stringify(updated));
    addLog('settings', `Updated admin settings`, 'info');
    return updated;
  }, [adminSettings]);

  // Toggle feature on/off
  const toggleFeature = useCallback((featureName, enabled) => {
    const updated = { ...featureToggles, [featureName]: enabled };
    setFeatureToggles(updated);
    localStorage.setItem('appforge_feature_toggles', JSON.stringify(updated));
    addLog('feature_toggle', `${featureName}: ${enabled ? 'enabled' : 'disabled'}`, 'info');
    return updated;
  }, [featureToggles]);

  // Check system health
  const checkSystemHealth = useCallback(() => {
    const health = {
      status: 'healthy',
      uptime: Math.floor(performance.now() / 1000),
      responseTime: Math.random() * 100,
      cpuUsage: Math.random() * 80,
      memoryUsage: Math.random() * 75,
      lastChecked: new Date().toISOString()
    };

    if (health.responseTime > 50) health.status = 'degraded';
    if (health.cpuUsage > 80 || health.memoryUsage > 85) health.status = 'critical';

    setSystemHealth(health);
    addLog('health_check', `System status: ${health.status}`, 'info');
    return health;
  }, []);

  // Add admin log entry
  const addLog = useCallback((type, message, level = 'info') => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      message,
      level,
      user: 'admin'
    };

    const updated = [logEntry, ...logs].slice(0, 1000); // Keep last 1000 logs
    setLogs(updated);
    localStorage.setItem('appforge_admin_logs', JSON.stringify(updated));
  }, [logs]);

  // Manage users
  const addUser = useCallback((user) => {
    const newUser = {
      id: Date.now(),
      ...user,
      createdAt: new Date().toISOString(),
      role: user.role || 'user',
      status: 'active'
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('appforge_admin_users', JSON.stringify(updated));
    addLog('user_management', `Added user: ${user.email}`, 'info');
    return newUser;
  }, [users, addLog]);

  // Update user role
  const updateUserRole = useCallback((userId, role) => {
    const updated = users.map(u =>
      u.id === userId ? { ...u, role } : u
    );
    setUsers(updated);
    localStorage.setItem('appforge_admin_users', JSON.stringify(updated));
    addLog('user_management', `Updated user role to ${role}`, 'info');
  }, [users, addLog]);

  // Deactivate user
  const deactivateUser = useCallback((userId) => {
    const updated = users.map(u =>
      u.id === userId ? { ...u, status: 'inactive' } : u
    );
    setUsers(updated);
    localStorage.setItem('appforge_admin_users', JSON.stringify(updated));
    addLog('user_management', `Deactivated user`, 'warning');
  }, [users, addLog]);

  // Set permissions
  const setUserPermissions = useCallback((userId, perms) => {
    const updated = { ...permissions, [userId]: perms };
    setPermissions(updated);
    localStorage.setItem('appforge_permissions', JSON.stringify(updated));
    addLog('permissions', `Updated user permissions`, 'info');
  }, [permissions, addLog]);

  // Get user permissions
  const getUserPermissions = useCallback((userId) => {
    return permissions[userId] || {
      read: true,
      write: false,
      delete: false,
      admin: false
    };
  }, [permissions]);

  // Generate system report
  const generateSystemReport = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      settings: adminSettings,
      health: systemHealth,
      featureToggles,
      userCount: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      logs: logs.slice(0, 100),
      totalLogs: logs.length
    };
  }, [adminSettings, systemHealth, featureToggles, users, logs]);

  // Export system report
  const exportSystemReport = useCallback(() => {
    const report = generateSystemReport();
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [generateSystemReport]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('appforge_admin_logs');
    addLog('system', 'Logs cleared', 'info');
  }, [addLog]);

  // Get system statistics
  const getSystemStats = useCallback(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      totalLogs: logs.length,
      recentLogs: logs.slice(0, 50),
      enabledFeatures: Object.entries(featureToggles)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name),
      disabledFeatures: Object.entries(featureToggles)
        .filter(([, enabled]) => !enabled)
        .map(([name]) => name)
    };
  }, [users, logs, featureToggles]);

  return {
    // Settings
    adminSettings,
    updateSettings,

    // Features
    featureToggles,
    toggleFeature,
    isFeatureEnabled: (name) => featureToggles[name] !== false,

    // System Health
    systemHealth,
    checkSystemHealth,

    // Logging
    logs,
    addLog,
    clearLogs,

    // Users
    users,
    addUser,
    updateUserRole,
    deactivateUser,

    // Permissions
    permissions,
    setUserPermissions,
    getUserPermissions,

    // Reporting
    generateSystemReport,
    exportSystemReport,
    getSystemStats
  };
}
