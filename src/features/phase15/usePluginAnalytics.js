import { useState, useCallback } from 'react';

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

  const trackInstall = useCallback((pluginId) => {
    setStats(prev => ({ ...prev, totalInstalls: prev.totalInstalls + 1 }));
  }, []);

  const trackUsage = useCallback((pluginId, userId) => {
    setStats(prev => ({ ...prev, activeUsers: prev.activeUsers + 1 }));
  }, []);

  const getPluginStats = useCallback(async (pluginId) => {
    return {
      installs: Math.floor(Math.random() * 10000),
      activeUsers: Math.floor(Math.random() * 5000),
      rating: (4 + Math.random()).toFixed(1),
      reviews: Math.floor(Math.random() * 500),
    };
  }, []);

  return { stats, trackInstall, trackUsage, getPluginStats };
};
