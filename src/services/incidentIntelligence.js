const STORAGE_KEY = 'appforge_incident_events';

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

const addEvent = (event) => {
  const events = load();
  const next = [...events, event];
  save(next);
  return next;
};

export const IncidentIntelligenceService = {
  recordEvent({ type, message, severity = 'info', metadata = {} }) {
    const event = {
      id: `evt_${Date.now()}`,
      type,
      message,
      severity,
      metadata,
      createdAt: new Date().toISOString(),
    };
    addEvent(event);
    return event;
  },

  queryIncident(question) {
    const events = load();
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

  reconstructTimeline() {
    const events = load();
    return events.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  groupAlerts() {
    const events = load();
    const grouped = events.reduce((acc, event) => {
      const key = event.type || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
    return grouped;
  },
};
