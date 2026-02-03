import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_marketplace_extensions';
const STATE_KEY = 'marketplaceExtensions';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const MarketplaceExtensionsService = {
  async listPlugins() {
    return load();
  },

  async addPlugin(name, category) {
    const plugins = await load();
    const entry = { id: `plugin_${Date.now()}`, name, category };
    const next = [entry, ...plugins];
    await save(next);
    return entry;
  },
};
