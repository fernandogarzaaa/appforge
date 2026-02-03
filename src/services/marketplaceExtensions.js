const STORAGE_KEY = 'appforge_marketplace_extensions';

const load = () => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};

const save = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const MarketplaceExtensionsService = {
  listPlugins() {
    return load();
  },

  addPlugin(name, category) {
    const plugins = load();
    const entry = { id: `plugin_${Date.now()}`, name, category };
    const next = [entry, ...plugins];
    save(next);
    return entry;
  },
};
