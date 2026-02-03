import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_data_pipeline';
const STATE_KEY = 'dataPipeline';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const DataPipelineService = {
  async listSources() {
    return load();
  },

  async addSource(type, config) {
    const sources = await load();
    const entry = { id: `source_${Date.now()}`, type, config };
    const next = [entry, ...sources];
    await save(next);
    return entry;
  },
};
