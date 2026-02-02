import { useState, useEffect, useCallback } from 'react';
import { persistenceService, websocketService } from '@/api/services';
import { toast } from 'sonner';

/**
 * useAdminDashboard Hook
 * Manage admin settings, feature toggles, and system health
 */
const defaultAdminSettings = {
  appName: 'AppForge',
  version: '1.0.0',
  environment: 'production',
  maintenanceMode: false,
  debugMode: false
};

export function useAdminDashboard() {
  const [adminSettings, setAdminSettings] = useState(defaultAdminSettings);

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
  const [serverState, setServerState] = useState(null);

  const loadFromLocalStorage = () => {
    const savedSettings = localStorage.getItem('appforge_admin_settings');
    if (savedSettings) setAdminSettings(JSON.parse(savedSettings));

    const toggles = localStorage.getItem('appforge_feature_toggles');
    if (toggles) setFeatureToggles(JSON.parse(toggles));

    const savedLogs = localStorage.getItem('appforge_admin_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    const savedUsers = localStorage.getItem('appforge_admin_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
  };

  // Initialize from persistence service with legacy fallback
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [stateResult, syncLogs] = await Promise.all([
          persistenceService.getUserState(),
          persistenceService.listSyncLogs({ limit: 50 }).catch(() => [])
        ]);
        if (!mounted) return;

        setServerState(stateResult);
        const persisted = stateResult?.state?.adminDashboard;
        if (persisted) {
          setAdminSettings(persisted.adminSettings || defaultAdminSettings);
          setFeatureToggles(persisted.featureToggles || {});
          setLogs(persisted.logs || []);
          setUsers(persisted.users || []);
          setPermissions(persisted.permissions || {});
        } else {
          loadFromLocalStorage();
        }

        if (Array.isArray(syncLogs) && syncLogs.length) {
          setLogs((prev) => [...syncLogs, ...prev].slice(0, 1000));
        }
      } catch (error) {
        console.error('Failed to load admin dashboard state; falling back to localStorage', error);
        loadFromLocalStorage();
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const persistAdminState = useCallback(async (partial = {}) => {
    const nextAdmin = {
      adminSettings,
      featureToggles,
      logs,
      users,
      permissions,
      ...partial
    };

    try {
      const nextState = {
        ...(serverState?.state || {}),
        adminDashboard: nextAdmin
      };
      const saved = await persistenceService.saveUserState({ state: nextState });
      setServerState(saved);
    } catch (error) {
      console.error('Failed to persist admin dashboard state', error);
    }
  }, [adminSettings, featureToggles, logs, users, permissions, serverState]);

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
    persistAdminState({ logs: updated });
  }, [logs, persistAdminState]);

  // Update admin settings
  const updateSettings = useCallback((newSettings) => {
    const updated = { ...adminSettings, ...newSettings };
    setAdminSettings(updated);
    persistAdminState({ adminSettings: updated });
    addLog('settings', `Updated admin settings`, 'info');
    return updated;
  }, [adminSettings, addLog, persistAdminState]);

  // Toggle feature on/off
  const toggleFeature = useCallback((featureName, enabled) => {
    const updated = { ...featureToggles, [featureName]: enabled };
    setFeatureToggles(updated);
    persistAdminState({ featureToggles: updated });
    addLog('feature_toggle', `${featureName}: ${enabled ? 'enabled' : 'disabled'}`, 'info');
    return updated;
  }, [featureToggles, addLog, persistAdminState]);

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
  }, [addLog]);

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
    persistAdminState({ users: updated });
    addLog('user_management', `Added user: ${user.email}`, 'info');
    return newUser;
  }, [users, addLog, persistAdminState]);

  // Update user role
  const updateUserRole = useCallback((userId, role) => {
    const updated = users.map(u =>
      u.id === userId ? { ...u, role } : u
    );
    setUsers(updated);
    persistAdminState({ users: updated });
    addLog('user_management', `Updated user role to ${role}`, 'info');
  }, [users, addLog, persistAdminState]);

  // Deactivate user
  const deactivateUser = useCallback((userId) => {
    const updated = users.map(u =>
      u.id === userId ? { ...u, status: 'inactive' } : u
    );
    setUsers(updated);
    persistAdminState({ users: updated });
    addLog('user_management', `Deactivated user`, 'warning');
  }, [users, addLog, persistAdminState]);

  // Set permissions
  const setUserPermissions = useCallback((userId, perms) => {
    const updated = { ...permissions, [userId]: perms };
    setPermissions(updated);
    persistAdminState({ permissions: updated });
    addLog('permissions', `Updated user permissions`, 'info');
  }, [permissions, addLog, persistAdminState]);

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
    addLog('system', 'Logs cleared', 'info');
    persistAdminState({ logs: [] });
  }, [addLog, persistAdminState]);

  // Real-time updates via WebSocket events
  useEffect(() => {
    websocketService.connect();

    const handleStateUpdated = (payload) => {
      const persisted = payload?.state?.adminDashboard;
      if (!persisted) return;
      setAdminSettings(persisted.adminSettings || defaultAdminSettings);
      setFeatureToggles(persisted.featureToggles || {});
      setLogs(persisted.logs || []);
      setUsers(persisted.users || []);
      setPermissions(persisted.permissions || {});
      setServerState(payload);
    };

    const handleSyncLog = (payload) => {
      setLogs((prev) => {
        const next = [payload, ...prev].slice(0, 1000);
        persistAdminState({ logs: next });
        return next;
      });

      toast.message('Sync status update', {
        description: payload?.message || payload?.status || 'New sync activity'
      });
    };

    websocketService.on('state:updated', handleStateUpdated);
    websocketService.on('sync:log', handleSyncLog);

    return () => {
      websocketService.off('state:updated', handleStateUpdated);
      websocketService.off('sync:log', handleSyncLog);
    };
  }, [persistAdminState]);

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
