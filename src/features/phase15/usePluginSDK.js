import { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for plugin SDK and development
 * @returns {Object} Plugin SDK utilities
 */
export const usePluginSDK = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.Plugin.list('-created_date', 200)
      .then((items) => {
        if (active) setPlugins(items || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const registerPlugin = useCallback(async (plugin) => {
    setLoading(true);
    try {
      const registered = await base44.entities.Plugin.create({
        ...plugin,
        status: 'active',
        source: 'sdk',
        registered_at: new Date().toISOString()
      });
      setPlugins(prev => [registered, ...prev]);
      return registered;
    } finally {
      setLoading(false);
    }
  }, []);

  const executePlugin = useCallback(async (pluginId, method, args) => {
    const response = await base44.functions.invoke('executePlugin', {
      plugin_id: pluginId,
      method,
      args
    });
    return response?.data || response;
  }, []);

  return { plugins, loading, registerPlugin, executePlugin };
};
