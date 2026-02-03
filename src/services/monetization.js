const STORAGE_KEY = 'appforge_tiers';

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

export const MonetizationService = {
  listTiers() {
    return load();
  },

  addTier(name, limits) {
    const tiers = load();
    const entry = { id: `tier_${Date.now()}`, name, limits };
    const next = [entry, ...tiers];
    save(next);
    return entry;
  },
};
