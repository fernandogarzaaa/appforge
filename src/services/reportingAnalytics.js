import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_reports';
const STATE_KEY = 'reportingAnalytics';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const ReportingAnalyticsService = {
  async listReports() {
    return load();
  },

  async scheduleReport(name, cadence) {
    const reports = await load();
    const entry = { id: `report_${Date.now()}`, name, cadence };
    const next = [entry, ...reports];
    await save(next);
    return entry;
  },
};
