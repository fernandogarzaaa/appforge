import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_incident_events';
const STATE_KEY = 'incidentIntelligence';

const load = () => loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: [] });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

const addEvent = async (event) => {
  const events = await load();
  const next = [...events, event];
  await save(next);
  return next;
};

export const IncidentIntelligenceService = {
  async recordEvent({ type, message, severity = 'info', metadata = {} }) {
    const event = {
      id: `evt_${Date.now()}`,
      type,
      message,
      severity,
      metadata,
      createdAt: new Date().toISOString(),
    };
    await addEvent(event);
    return event;
  },

  async queryIncident(question) {
    const events = await load();
    const related = events.filter((event) =>
      question ? event.message.toLowerCase().includes(question.toLowerCase()) : true
    );
    return {
      question,
      answer: related.length
        ? `Found ${related.length} related events.`
        : 'No related events found.',
      related,
    };
  },

  predictAnomaly(metrics = []) {
    const score = metrics.length ? Math.min(0.9, 0.4 + metrics.length * 0.05) : 0.2;
    return {
      predicted: score > 0.6,
      score,
      message: score > 0.6 ? 'Potential anomaly detected.' : 'No anomaly predicted.',
    };
  },

  suggestRemediation(event) {
    return [
      {
        id: `fix_${Date.now()}`,
        title: 'Rollback latest deployment',
        confidence: 0.7,
      },
      {
        id: `fix_${Date.now() + 1}`,
        title: 'Scale affected service',
        confidence: 0.62,
      },
    ];
  },

  async reconstructTimeline() {
    const events = await load();
    return events.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  async groupAlerts() {
    const events = await load();
    const grouped = events.reduce((acc, event) => {
      const key = event.type || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
    return grouped;
  },
};
