import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function usePluginMarketplace() {
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

  const publishPlugin = useCallback(async (plugin) => {
    const created = await base44.entities.Plugin.create({
      ...plugin,
      status: 'published',
      created_at: new Date().toISOString()
    });
    setPlugins((prev) => [created, ...prev].slice(0, 200));
    return created;
  }, []);

  const installPlugin = useCallback(async (pluginId) => {
    await base44.entities.PluginInstall.create({
      plugin_id: pluginId,
      status: 'installed',
      installed_at: new Date().toISOString()
    });

    setPlugins((prev) => prev.map((plugin) =>
      plugin.id === pluginId ? { ...plugin, installed: true } : plugin
    ));
  }, []);

  return {
    plugins,
    loading,
    publishPlugin,
    installPlugin
  };
}
