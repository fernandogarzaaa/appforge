import { useState, useCallback } from 'react';
import { generateAPIKey } from '@/lib/apiKeyUtils';

// Mock data - replace with actual API calls
const mockAPIKeys = [
  {
    id: 'key_1',
    name: 'Development Key',
    key: 'appforge_XXXXXXXXXXXXX12345678',
    maskedKey: '****12345678',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    scopes: ['read:projects', 'read:functions'],
    active: true
  },
  {
    id: 'key_2',
    name: 'CI/CD Pipeline',
    key: 'appforge_XXXXXXXXXXXXX87654321',
    maskedKey: '****87654321',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
    scopes: ['read:projects', 'read:functions', 'write:projects'],
    active: true
  }
];

export function useAPIKeys() {
  const [keys, setKeys] = useState(mockAPIKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createKey = useCallback(async (name, scopes) => {
    setIsLoading(true);
    setError(null);
    try {
      const newKey = {
        id: `key_${Date.now()}`,
        name,
        key: generateAPIKey(),
        maskedKey: `****${Math.random().toString(36).substring(2, 10)}`,
        createdAt: new Date(),
        lastUsed: null,
        scopes,
        active: true
      };
      setKeys([...keys, newKey]);
      return newKey;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [keys]);

  const revokeKey = useCallback(async (keyId) => {
    setIsLoading(true);
    setError(null);
    try {
      setKeys(keys.map(k => 
        k.id === keyId ? { ...k, active: false } : k
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [keys]);

  const deleteKey = useCallback(async (keyId) => {
    setIsLoading(true);
    setError(null);
    try {
      setKeys(keys.filter(k => k.id !== keyId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [keys]);

  const updateKeyScopes = useCallback(async (keyId, scopes) => {
    setIsLoading(true);
    setError(null);
    try {
      setKeys(keys.map(k =>
        k.id === keyId ? { ...k, scopes } : k
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [keys]);

  const getActiveKeys = useCallback(() => {
    return keys.filter(k => k.active);
  }, [keys]);

  const getKeyById = useCallback((keyId) => {
    return keys.find(k => k.id === keyId);
  }, [keys]);

  return {
    keys: getActiveKeys(),
    allKeys: keys,
    isLoading,
    error,
    createKey,
    revokeKey,
    deleteKey,
    updateKeyScopes,
    getKeyById
  };
}
