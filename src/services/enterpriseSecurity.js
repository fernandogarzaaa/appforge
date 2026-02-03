import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_security_controls';
const STATE_KEY = 'enterpriseSecurity';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const EnterpriseSecurityService = {
  async listControls() {
    return load();
  },

  async addControl(name, status) {
    const controls = await load();
    const entry = { id: `control_${Date.now()}`, name, status };
    const next = [entry, ...controls];
    await save(next);
    return entry;
  },
};
