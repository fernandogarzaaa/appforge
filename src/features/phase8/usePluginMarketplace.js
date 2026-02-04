import { useCallback, useState } from 'react';

const STORAGE_KEY = 'appforge_plugin_marketplace';

const loadPlugins = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const savePlugins = (plugins) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
  } catch {
    // no-op
  }
};

export function usePluginMarketplace() {
  const [plugins, setPlugins] = useState(loadPlugins);

  const publishPlugin = useCallback((plugin) => {
    const next = [{ ...plugin, id: Date.now(), status: 'published' }, ...plugins].slice(0, 200);
    setPlugins(next);
    savePlugins(next);
  }, [plugins]);

  const installPlugin = useCallback((pluginId) => {
    const next = plugins.map((plugin) =>
      plugin.id === pluginId ? { ...plugin, installed: true } : plugin
    );
    setPlugins(next);
    savePlugins(next);
  }, [plugins]);

  return {
    plugins,
    publishPlugin,
    installPlugin
  };
}
