import { persistenceService } from '@/api/services';

const loadLocal = (storageKey, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const saveLocal = (storageKey, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const loadPersistedState = async ({ storageKey, stateKey, fallback }) => {
  const localValue = loadLocal(storageKey, fallback);
  try {
    const result = await persistenceService.getUserState();
    const serverValue = result?.state?.[stateKey];
    if (serverValue !== undefined && serverValue !== null) {
      saveLocal(storageKey, serverValue);
      return serverValue;
    }
  } catch (error) {
    console.error(`Failed to load ${stateKey} from persistence`, error);
  }
  return localValue;
};

export const savePersistedState = async ({ storageKey, stateKey, value }) => {
  saveLocal(storageKey, value);
  try {
    const result = await persistenceService.getUserState();
    const nextState = {
      ...(result?.state || {}),
      [stateKey]: value,
    };
    const saved = await persistenceService.saveUserState({ state: nextState });
    return saved?.state?.[stateKey] ?? value;
  } catch (error) {
    console.error(`Failed to save ${stateKey} to persistence`, error);
    return value;
  }
};
