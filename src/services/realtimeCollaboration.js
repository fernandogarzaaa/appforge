const STORAGE_KEY = 'appforge_realtime_collab';

const load = () => {
  if (typeof window === 'undefined') return { sessions: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { sessions: [] };
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { sessions: [] };
  }
};

const save = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const RealtimeCollaborationService = {
  listSessions() {
    return load().sessions || [];
  },

  startSession(topic) {
    const state = load();
    const entry = { id: `session_${Date.now()}`, topic, startedAt: new Date().toISOString() };
    const next = { ...state, sessions: [entry, ...state.sessions] };
    save(next);
    return entry;
  },
};
