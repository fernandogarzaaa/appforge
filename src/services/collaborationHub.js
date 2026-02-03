import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_collaboration_hub';
const STATE_KEY = 'collaborationHub';

const load = () =>
  loadPersistedState({
    storageKey: STORAGE_KEY,
    stateKey: STATE_KEY,
    fallback: { warRooms: [], activity: [] },
  });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const CollaborationHubService = {
  async listWarRooms() {
    const state = await load();
    return state.warRooms || [];
  },

  async listActivity() {
    const state = await load();
    return state.activity || [];
  },

  async createWarRoom(name, incidentId) {
    const state = await load();
    const room = {
      id: `room_${Date.now()}`,
      name,
      incidentId,
      createdAt: new Date().toISOString(),
    };
    const next = { ...state, warRooms: [room, ...state.warRooms] };
    await save(next);
    return room;
  },

  async logActivity(entry) {
    const state = await load();
    const next = {
      ...state,
      activity: [
        { id: `activity_${Date.now()}`, ...entry, createdAt: new Date().toISOString() },
        ...state.activity,
      ],
    };
    await save(next);
    return next.activity[0];
  },
};
