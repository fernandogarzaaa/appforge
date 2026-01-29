import { useState, useCallback, useEffect, useMemo } from 'react';
import { generateAPIKey } from '@/lib/apiKeyUtils';

const STORAGE_KEY = 'apiKeys';
const DEFAULT_KEYS = [
  {
    id: 'key-id-1',
    name: 'Primary API Key',
    value: generateAPIKey(),
    scopes: ['read', 'write'],
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString()
  },
  {
    id: 'key-id-2',
    name: 'Read Only Key',
    value: generateAPIKey(),
    scopes: ['read'],
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    revokedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
  }
];

const loadKeys = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KEYS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_KEYS;
  } catch {
    return DEFAULT_KEYS;
  }
};

const persistKeys = (keys) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore persistence errors in tests
  }
};

export function useAPIKeys() {
  const [keys, setKeys] = useState(() => loadKeys());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const createKey = useCallback(async ({ name, scopes = [] }) => {
    const newKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      value: generateAPIKey(),
      scopes,
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString()
    };

    setKeys(prev => {
      const updated = [newKey, ...prev];
      persistKeys(updated);
      return updated;
    });

    return newKey;
  }, []);

  const revealKey = useCallback(async (keyId) => {
    setVisibleKeys(prev => (prev.includes(keyId) ? prev : [...prev, keyId]));
    const key = keys.find(k => k.id === keyId);
    return key?.value || null;
  }, [keys]);

  const toggleKeyVisibility = useCallback((keyId) => {
    setVisibleKeys(prev => {
      const next = prev.includes(keyId) ? prev.filter(id => id !== keyId) : [...prev, keyId];
      return next;
    });
  }, []);

  const revokeKey = useCallback(async (keyId) => {
    setKeys(prev => {
      const updated = prev.map(key =>
        key.id === keyId ? { ...key, active: false, revokedAt: new Date().toISOString() } : key
      );
      persistKeys(updated);
      return updated;
    });
  }, []);

  const deleteKey = useCallback(async (keyId) => {
    setKeys(prev => {
      const updated = prev.filter(key => key.id !== keyId);
      persistKeys(updated);
      return updated;
    });
  }, []);

  const copyKeyToClipboard = useCallback(async (value) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    }
  }, []);

  const filterByScope = useCallback((scope) => {
    if (!scope) return keys;
    return keys.filter(key => Array.isArray(key.scopes) && key.scopes.includes(scope));
  }, [keys]);

  const sortKeys = useCallback((field = 'createdAt', order = 'desc') => {
    return [...keys].sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      if (aVal === bVal) return 0;
      return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [keys]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getExpiringKeys = useCallback((days = 30) => {
    const threshold = Date.now() + days * 24 * 60 * 60 * 1000;
    return keys.filter(key => {
      const expiresAt = key.expiresAt ? new Date(key.expiresAt).getTime() : 0;
      return expiresAt > 0 && expiresAt <= threshold;
    });
  }, [keys]);

  const stats = useMemo(() => {
    const total = keys.length;
    const active = keys.filter(key => key.active).length;
    const revoked = keys.filter(key => !key.active).length;
    return { total, active, revoked };
  }, [keys]);

  return {
    keys,
    loading,
    error,
    visibleKeys,
    createKey,
    revealKey,
    toggleKeyVisibility,
    revokeKey,
    deleteKey,
    copyKeyToClipboard,
    filterByScope,
    sortKeys,
    clearError,
    getExpiringKeys,
    stats
  };
}
