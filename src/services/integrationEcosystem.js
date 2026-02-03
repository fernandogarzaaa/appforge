import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_integrations_v2';
const STATE_KEY = 'integrationEcosystem';

const load = () =>
  loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const IntegrationEcosystemService = {
  async listIntegrations() {
    return load();
  },

  async connectIntegration(type, config) {
    const integrations = await load();
    const entry = {
      id: `integration_${Date.now()}`,
      type,
      config,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    };
    const next = [entry, ...integrations];
    await save(next);
    return entry;
  },

  async disconnectIntegration(id) {
    const next = (await load()).filter((item) => item.id !== id);
    await save(next);
    return next;
  },
};
