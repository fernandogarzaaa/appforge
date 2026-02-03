import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_tiers';
const STATE_KEY = 'monetization';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const MonetizationService = {
  async listTiers() {
    return load();
  },

  async addTier(name, limits) {
    const tiers = await load();
    const entry = { id: `tier_${Date.now()}`, name, limits };
    const next = [entry, ...tiers];
    await save(next);
    return entry;
  },
};
