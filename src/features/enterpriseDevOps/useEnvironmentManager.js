import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_envs';

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

export function useEnvironmentManager() {
  const [environments, setEnvironments] = useState(() => load());

  useEffect(() => {
    save(environments);
  }, [environments]);

  const createEnvironment = useCallback((name, region) => {
    const environment = {
      id: `env_${Date.now()}`,
      name,
      region,
      createdAt: new Date().toISOString(),
    };
    setEnvironments((prev) => [environment, ...prev]);
    return environment;
  }, []);

  const deleteEnvironment = useCallback((id) => {
    setEnvironments((prev) => prev.filter((env) => env.id !== id));
  }, []);

  return { environments, createEnvironment, deleteEnvironment };
}
