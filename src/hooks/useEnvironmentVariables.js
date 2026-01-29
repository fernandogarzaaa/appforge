import { useState, useCallback, useEffect, useMemo } from 'react';
import { environmentVariablesService } from '@/api/services';

/**
 * Hook for managing environment variables
 */
export const useEnvironmentVariables = (projectId) => {
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  const [revealedIds, setRevealedIds] = useState(new Set());

  useEffect(() => {
    const fetchVariables = async () => {
      setLoading(true);
      setError(null);

      if (!projectId) {
        return;
      }

      try {
        const data = await environmentVariablesService.getAll(projectId, selectedEnvironment);
        setVariables(data || []);
      } catch (err) {
        setError(err?.message || 'Failed to fetch environment variables');
        console.error('Failed to fetch environment variables:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, [projectId, selectedEnvironment]);

  const addVariable = useCallback(async (variable) => {
    const newVar = {
      id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...variable
    };

    if (!projectId) {
      setVariables(prev => [newVar, ...prev]);
      return newVar;
    }

    try {
      const created = await environmentVariablesService.create(projectId, variable);
      setVariables(prev => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err?.message || 'Failed to add variable');
      throw err;
    }
  }, [projectId]);

  const updateVariable = useCallback(async (id, updates) => {
    if (!projectId) {
      setVariables(prev =>
        prev.map(v => (v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v))
      );
      return;
    }

    try {
      await environmentVariablesService.update(id, updates);
      setVariables(prev =>
        prev.map(v => (v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v))
      );
    } catch (err) {
      setError(err?.message || 'Failed to update variable');
      throw err;
    }
  }, [projectId]);

  const deleteVariable = useCallback(async (id) => {
    if (!projectId) {
      setVariables(prev => prev.filter(v => v.id !== id));
      return;
    }

    try {
      await environmentVariablesService.delete(id);
      setVariables(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete variable');
      throw err;
    }
  }, [projectId]);

  const toggleVisibility = useCallback((id) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const revealValue = useCallback(async (id) => {
    setRevealedIds(prev => new Set(prev).add(id));
  }, []);

  const hideValue = useCallback((id) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isRevealed = useCallback((id) => {
    return revealedIds.has(id);
  }, [revealedIds]);

  const copyToClipboard = useCallback(async (value) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    }
  }, []);

  const filterByEnvironment = useCallback((environment) => {
    return variables.filter(v => v.environment === environment);
  }, [variables]);

  const filterByType = useCallback((type) => {
    return variables.filter(v => v.type === type);
  }, [variables]);

  const exportAsEnv = useCallback(() => {
    return variables.map(v => `${v.name}=${v.value ?? ''}`).join('\n');
  }, [variables]);

  const exportAsJSON = useCallback(() => {
    return JSON.stringify(variables, null, 2);
  }, [variables]);

  const readFileText = useCallback((file) => {
    if (!file) return Promise.resolve('');
    if (typeof file.text === 'function') {
      return file.text();
    }

    if (typeof FileReader !== 'undefined') {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsText(file);
      });
    }

    if (typeof file === 'string') {
      return Promise.resolve(file);
    }

    if (typeof file?.content === 'string') {
      return Promise.resolve(file.content);
    }

    return Promise.resolve('');
  }, []);

  const importFromFile = useCallback(async (file) => {
    const text = await readFileText(file);
    const lines = text.split('\n').filter(Boolean);
    const imported = lines.map(line => {
      const [name, ...rest] = line.split('=');
      return {
        id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        value: rest.join('=').trim(),
        type: 'plain',
        environment: selectedEnvironment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    setVariables(prev => [...imported, ...prev]);
    return imported;
  }, [readFileText, selectedEnvironment]);

  const validateName = useCallback((name) => {
    if (!name) return false;
    return /^[A-Z0-9_]+$/.test(name);
  }, []);

  const validateValue = useCallback((value) => {
    return typeof value === 'string' && value.length > 0;
  }, []);

  const stats = useMemo(() => {
    const byEnvironment = variables.reduce((acc, v) => {
      acc[v.environment] = (acc[v.environment] || 0) + 1;
      return acc;
    }, {});

    const byType = variables.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: variables.length,
      byEnvironment,
      byType
    };
  }, [variables]);

  const isDuplicate = useCallback((name) => {
    return variables.some(v => v.name === name);
  }, [variables]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sortBy = useCallback((field = 'name', order = 'asc') => {
    setVariables(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        if (aVal === bVal) return 0;
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
      return sorted;
    });
  }, []);

  const getMaskedValue = useCallback((value, type = 'plain') => {
    if (type !== 'secret') return value;
    if (!value) return '****';
    return `****${String(value).slice(-4)}`;
  }, []);

  return {
    variables,
    loading,
    isLoading: loading,
    error,
    selectedEnvironment,
    setSelectedEnvironment,
    addVariable,
    updateVariable,
    deleteVariable,
    toggleVisibility,
    revealValue,
    hideValue,
    toggleReveal: toggleVisibility,
    isRevealed,
    copyToClipboard,
    filterByEnvironment,
    filterByType,
    exportAsEnv,
    exportAsJSON,
    importFromFile,
    validateName,
    validateValue,
    stats,
    isDuplicate,
    clearError,
    sortBy,
    getMaskedValue
  };
};

export default useEnvironmentVariables;
