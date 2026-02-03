import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_product_analytics';
const STATE_KEY = 'productAnalytics';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const ProductAnalyticsService = {
  async recordEvent(event) {
    const events = await load();
    const entry = { id: `metric_${Date.now()}`, ...event };
    const next = [entry, ...events];
    await save(next);
    return entry;
  },

  async listEvents() {
    return load();
  },
};
