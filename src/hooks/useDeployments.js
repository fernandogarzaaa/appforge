import { useState, useCallback, useEffect } from 'react';
import { generateMockDeploymentHistory, filterDeployments, sortDeployments } from '@/lib/deploymentHistory';

/**
 * Hook for managing deployment history state and operations
 */
export const useDeployments = (projectId) => {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    environment: 'all',
    branch: '',
    startDate: null,
    endDate: null
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load mock deployments on mount
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockDeploymentHistory(20);
      setDeployments(mockData);
      setIsLoading(false);
    }, 500);
  }, [projectId]);

  const getFilteredAndSorted = useCallback(() => {
    const filtered = filterDeployments(deployments, filters);
    return sortDeployments(filtered, sortBy, sortOrder);
  }, [deployments, filters, sortBy, sortOrder]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      environment: 'all',
      branch: '',
      startDate: null,
      endDate: null
    });
  }, []);

  const rollback = useCallback(async (deploymentId, previousVersion) => {
    try {
      setError(null);
      // Simulate rollback operation
      const newDeployment = {
        id: `deploy_${Date.now()}`,
        status: 'deploying',
        version: previousVersion,
        created_at: new Date().toISOString(),
        // ... other fields
      };
      setDeployments(prev => [newDeployment, ...prev]);
      return newDeployment;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const cancel = useCallback(async (deploymentId) => {
    try {
      setError(null);
      setDeployments(prev =>
        prev.map(d =>
          d.id === deploymentId
            ? { ...d, status: 'cancelled', completed_at: new Date().toISOString() }
            : d
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getDeploymentLogs = useCallback(async (deploymentId) => {
    // Return mock logs
    return [
      '[INFO] Starting deployment...',
      '[INFO] Building project...',
      '[DEBUG] Compiling components...',
      '[INFO] Build successful (1.23s)',
      '[INFO] Running tests...',
      '[INFO] All tests passed',
      '[INFO] Uploading artifacts...',
      '[INFO] Artifacts uploaded successfully',
      '[INFO] Deployment complete',
      '[SUCCESS] Deployment finished at ' + new Date().toLocaleTimeString()
    ];
  }, []);

  return {
    deployments: getFilteredAndSorted(),
    allDeployments: deployments,
    isLoading,
    error,
    filters,
    sortBy,
    sortOrder,
    updateFilter,
    clearFilters,
    setSortBy,
    setSortOrder,
    rollback,
    cancel,
    getDeploymentLogs
  };
};

export default useDeployments;
