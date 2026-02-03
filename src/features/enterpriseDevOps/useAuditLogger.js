import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_audit_logs';

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

export function useAuditLogger() {
  const [logs, setLogs] = useState(() => load());

  useEffect(() => {
    save(logs);
  }, [logs]);

  const record = useCallback((action, metadata = {}) => {
    const entry = {
      id: `log_${Date.now()}`,
      action,
      metadata,
      createdAt: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev]);
    return entry;
  }, []);

  return { logs, record };
}
