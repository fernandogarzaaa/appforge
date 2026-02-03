const STORAGE_KEY = 'appforge_product_analytics';

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

export const ProductAnalyticsService = {
  recordEvent(event) {
    const events = load();
    const entry = { id: `metric_${Date.now()}`, ...event };
    const next = [entry, ...events];
    save(next);
    return entry;
  },

  listEvents() {
    return load();
  },
};
