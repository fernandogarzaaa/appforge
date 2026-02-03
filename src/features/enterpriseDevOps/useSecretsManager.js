import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_secrets';

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

export function useSecretsManager() {
  const [secrets, setSecrets] = useState(() => load());

  useEffect(() => {
    save(secrets);
  }, [secrets]);

  const addSecret = useCallback((name, value) => {
    const secret = {
      id: `secret_${Date.now()}`,
      name,
      value: value ? '••••••' : '',
      createdAt: new Date().toISOString(),
    };
    setSecrets((prev) => [secret, ...prev]);
    return secret;
  }, []);

  const removeSecret = useCallback((id) => {
    setSecrets((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { secrets, addSecret, removeSecret };
}
