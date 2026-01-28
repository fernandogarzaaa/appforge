import { useState, useCallback, useEffect } from 'react';
import { environmentVariablesService } from '@/api/services';

/**
 * Hook for managing environment variables
 */
export const useEnvironmentVariables = (projectId) => {
  const [variables, setVariables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  const [revealedIds, setRevealedIds] = useState(new Set());

  // Load variables from backend
  useEffect(() => {
    const fetchVariables = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await environmentVariablesService.getAll(projectId, selectedEnvironment);
        setVariables(data);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch environment variables:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) {
      fetchVariables();
    }
  }, [projectId, selectedEnvironment]);

  const addVariable = useCallback(async (variable) => {
    try {
      const newVar = await environmentVariablesService.create(projectId, variable);
      setVariables(prev => [newVar, ...prev]);
      return newVar;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  const updateVariable = useCallback(async (id, updates) => {
    try {
      await environmentVariablesService.update(id, updates);
      setVariables(prev =>
        prev.map(v => (v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v))
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteVariable = useCallback(async (id) => {
    try {
      await environmentVariablesService.delete(id);
      setVariables(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const toggleReveal = useCallback((id) => {
    setRevealedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const isRevealed = useCallback((id) => {
    return revealedIds.has(id);
  }, [revealedIds]);

  const getVariablesByEnvironment = useCallback((environment) => {
    return variables.filter(v => v.environment === environment);
  }, [variables]);

  const duplicateVariable = useCallback((id) => {
    const variable = variables.find(v => v.id === id);
    if (variable) {
      const newVar = {
        ...variable,
        id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${variable.name}_COPY`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      addVariable(newVar);
      return newVar;
    }
  }, [variables, addVariable]);

  return {
    variables,
    isLoading,
    error,
    selectedEnvironment,
    setSelectedEnvironment,
    addVariable,
    updateVariable,
    deleteVariable,
    toggleReveal,
    isRevealed,
    getVariablesByEnvironment,
    duplicateVariable
  };
};

export default useEnvironmentVariables;
