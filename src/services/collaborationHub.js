const STORAGE_KEY = 'appforge_collaboration_hub';

const load = () => {
  if (typeof window === 'undefined') return { warRooms: [], activity: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { warRooms: [], activity: [] };
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { warRooms: [], activity: [] };
  }
};

const save = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const CollaborationHubService = {
  listWarRooms() {
    return load().warRooms || [];
  },

  createWarRoom(name, incidentId) {
    const state = load();
    const room = {
      id: `room_${Date.now()}`,
      name,
      incidentId,
      createdAt: new Date().toISOString(),
    };
    const next = { ...state, warRooms: [room, ...state.warRooms] };
    save(next);
    return room;
  },

  logActivity(entry) {
    const state = load();
    const next = {
      ...state,
      activity: [
        { id: `activity_${Date.now()}`, ...entry, createdAt: new Date().toISOString() },
        ...state.activity,
      ],
    };
    save(next);
    return next.activity[0];
  },
};
