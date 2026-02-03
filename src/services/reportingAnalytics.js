const STORAGE_KEY = 'appforge_reports';

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

export const ReportingAnalyticsService = {
  listReports() {
    return load();
  },

  scheduleReport(name, cadence) {
    const reports = load();
    const entry = { id: `report_${Date.now()}`, name, cadence };
    const next = [entry, ...reports];
    save(next);
    return entry;
  },
};
