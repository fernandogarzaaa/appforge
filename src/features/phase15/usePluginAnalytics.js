import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for plugin analytics
 * @returns {Object} Plugin analytics utilities
 */
export const usePluginAnalytics = () => {
  const [stats, setStats] = useState({
    totalInstalls: 0,
    activeUsers: 0,
    avgRating: 0,
    downloads: 0,
  });

  const trackInstall = useCallback(async (pluginId) => {
    await base44.entities.PluginEvent.create({
      plugin_id: pluginId,
      event_type: 'install',
      created_at: new Date().toISOString()
    });
    setStats(prev => ({ ...prev, totalInstalls: prev.totalInstalls + 1 }));
  }, []);

  const trackUsage = useCallback(async (pluginId, userId) => {
    await base44.entities.PluginEvent.create({
      plugin_id: pluginId,
      user_id: userId,
      event_type: 'execute',
      created_at: new Date().toISOString()
    });
    setStats(prev => ({ ...prev, activeUsers: prev.activeUsers + 1 }));
  }, []);

  const getPluginStats = useCallback(async (pluginId) => {
    const response = await base44.functions.invoke('getPluginStats', { plugin_id: pluginId });
    return response?.data || response;
  }, []);

  return { stats, trackInstall, trackUsage, getPluginStats };
};
