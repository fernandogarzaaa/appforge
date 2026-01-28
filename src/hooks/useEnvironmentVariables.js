import { useState, useCallback, useEffect } from 'react';
import { generateMockEnvVariables } from '@/lib/environmentVariables';

/**
 * Hook for managing environment variables
 */
export const useEnvironmentVariables = (projectId) => {
  const [variables, setVariables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  const [revealedIds, setRevealedIds] = useState(new Set());

  // Load mock variables on mount
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockEnvVariables(10);
      setVariables(mockData);
      setIsLoading(false);
    }, 500);
  }, [projectId]);

  const addVariable = useCallback((variable) => {
    setVariables(prev => [variable, ...prev]);
  }, []);

  const updateVariable = useCallback((id, updates) => {
    setVariables(prev =>
      prev.map(v => (v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v))
    );
  }, []);

  const deleteVariable = useCallback((id) => {
    setVariables(prev => prev.filter(v => v.id !== id));
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
