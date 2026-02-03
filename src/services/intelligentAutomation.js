const STORAGE_KEY = 'appforge_automation_plans';

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

export const IntelligentAutomationService = {
  listAutomations() {
    return load();
  },

  addAutomation(name, status = 'draft') {
    const items = load();
    const entry = { id: `auto_${Date.now()}`, name, status };
    const next = [entry, ...items];
    save(next);
    return entry;
  },
};
