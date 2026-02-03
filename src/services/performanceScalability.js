import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_performance_layers';
const STATE_KEY = 'performanceScalability';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const PerformanceScalabilityService = {
  async listLayers() {
    return load();
  },

  async addLayer(name, status = 'planned') {
    const layers = await load();
    const entry = { id: `layer_${Date.now()}`, name, status };
    const next = [entry, ...layers];
    await save(next);
    return entry;
  },
};
