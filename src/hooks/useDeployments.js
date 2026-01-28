import { useState, useCallback, useEffect } from 'react';
import { filterDeployments, sortDeployments } from '@/lib/deploymentHistory';
import { deploymentsService } from '@/api/services';

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

  // Load deployments from backend
  useEffect(() => {
    const fetchDeployments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await deploymentsService.getAll(projectId, filters);
        setDeployments(data);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch deployments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) {
      fetchDeployments();
    }
  }, [projectId, filters]);

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
      const newDeployment = await deploymentsService.rollback(deploymentId, previousVersion);
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
      await deploymentsService.cancel(deploymentId);
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
    try {
      const logs = await deploymentsService.getLogs(deploymentId);
      return logs;
    } catch (err) {
      console.error('Failed to fetch deployment logs:', err);
      return [];
    }
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
