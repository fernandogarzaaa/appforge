import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_automation_plans';
const STATE_KEY = 'intelligentAutomation';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const IntelligentAutomationService = {
  async listAutomations() {
    return load();
  },

  async addAutomation(name, status = 'draft') {
    const items = await load();
    const entry = { id: `auto_${Date.now()}`, name, status };
    const next = [entry, ...items];
    await save(next);
    return entry;
  },
};
