const STORAGE_KEY = 'appforge_performance_layers';

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

export const PerformanceScalabilityService = {
  listLayers() {
    return load();
  },

  addLayer(name, status = 'planned') {
    const layers = load();
    const entry = { id: `layer_${Date.now()}`, name, status };
    const next = [entry, ...layers];
    save(next);
    return entry;
  },
};
