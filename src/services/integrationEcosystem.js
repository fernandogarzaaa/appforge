const STORAGE_KEY = 'appforge_integrations_v2';

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

export const IntegrationEcosystemService = {
  listIntegrations() {
    return load();
  },

  connectIntegration(type, config) {
    const integrations = load();
    const entry = {
      id: `integration_${Date.now()}`,
      type,
      config,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    };
    const next = [entry, ...integrations];
    save(next);
    return entry;
  },

  disconnectIntegration(id) {
    const next = load().filter((item) => item.id !== id);
    save(next);
    return next;
  },
};
