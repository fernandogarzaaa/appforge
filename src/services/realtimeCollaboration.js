import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_realtime_collab';
const STATE_KEY = 'realtimeCollaboration';

const load = () =>
  loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: { sessions: [] } });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const RealtimeCollaborationService = {
  async listSessions() {
    const state = await load();
    return state.sessions || [];
  },

  async startSession(topic) {
    const state = await load();
    const entry = { id: `session_${Date.now()}`, topic, startedAt: new Date().toISOString() };
    const next = { ...state, sessions: [entry, ...state.sessions] };
    await save(next);
    return entry;
  },
};
