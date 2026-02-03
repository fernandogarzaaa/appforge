const STORAGE_KEY = 'appforge_security_controls';

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

export const EnterpriseSecurityService = {
  listControls() {
    return load();
  },

  addControl(name, status) {
    const controls = load();
    const entry = { id: `control_${Date.now()}`, name, status };
    const next = [entry, ...controls];
    save(next);
    return entry;
  },
};
