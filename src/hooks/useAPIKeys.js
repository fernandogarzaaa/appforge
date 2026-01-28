import { useState, useCallback, useEffect } from 'react';
import { generateAPIKey } from '@/lib/apiKeyUtils';
import { apiKeysService } from '@/api/services';

export function useAPIKeys() {
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch API keys on mount
  useEffect(() => {
    const fetchKeys = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiKeysService.getAll();
        setKeys(data);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch API keys:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKeys();
  }, []);

  const createKey = useCallback(async (name, scopes) => {
    setIsLoading(true);
    setError(null);
    try {
      const newKey = await apiKeysService.create({ name, scopes });
      setKeys(prevKeys => [newKey, ...prevKeys]);
      return newKey;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeKey = useCallback(async (keyId) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiKeysService.revoke(keyId);
      setKeys(prevKeys => prevKeys.map(k => 
        k.id === keyId ? { ...k, active: false } : k
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteKey = useCallback(async (keyId) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiKeysService.delete(keyId);
      setKeys(prevKeys => prevKeys.filter(k => k.id !== keyId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateKeyScopes = useCallback(async (keyId, scopes) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiKeysService.updateScopes(keyId, scopes);
      setKeys(prevKeys => prevKeys.map(k =>
        k.id === keyId ? { ...k, scopes } : k
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
