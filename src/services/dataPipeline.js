const STORAGE_KEY = 'appforge_data_pipeline';

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

export const DataPipelineService = {
  listSources() {
    return load();
  },

  addSource(type, config) {
    const sources = load();
    const entry = { id: `source_${Date.now()}`, type, config };
    const next = [entry, ...sources];
    save(next);
    return entry;
  },
};
