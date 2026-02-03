import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_ai_learning_memory';

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

export function useLearningMemory() {
  const [entries, setEntries] = useState(() => load());

  useEffect(() => {
    save(entries);
  }, [entries]);

  const rememberFix = useCallback((issue, fix) => {
    const entry = {
      id: `memory_${Date.now()}`,
      issue,
      fix,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  return { entries, rememberFix };
}
