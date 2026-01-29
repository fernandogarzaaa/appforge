import { useState, useCallback, useEffect, useMemo } from 'react';

const DEFAULT_DEPLOYMENTS = [
  {
    id: 'deploy-id-1',
    status: 'running',
    environment: 'production',
    branch: 'main',
    started_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    completed_at: null,
    duration: 300
  },
  {
    id: 'deploy-id-2',
    status: 'success',
    environment: 'staging',
    branch: 'develop',
    started_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    duration: 600
  },
  {
    id: 'deploy-id-3',
    status: 'failed',
    environment: 'production',
    branch: 'main',
    started_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    duration: 900
  }
];

/**
 * Hook for managing deployment history state and operations
 */
export const useDeployments = () => {
  const [deployments, setDeployments] = useState(DEFAULT_DEPLOYMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const filterByStatus = useCallback((status) => {
    if (!status || status === 'all') return deployments;
    return deployments.filter(d => d.status === status);
  }, [deployments]);

  const filterByEnvironment = useCallback((environment) => {
    if (!environment || environment === 'all') return deployments;
    return deployments.filter(d => d.environment === environment);
  }, [deployments]);

  const filterByBranch = useCallback((branch) => {
    if (!branch) return deployments;
    return deployments.filter(d => d.branch === branch);
  }, [deployments]);

  const sortByDate = useCallback((order = 'desc') => {
    return [...deployments].sort((a, b) => {
      const aTime = new Date(a.started_at).getTime();
      const bTime = new Date(b.started_at).getTime();
      return order === 'asc' ? aTime - bTime : bTime - aTime;
    });
  }, [deployments]);

  const sortByDuration = useCallback((order = 'desc') => {
    return [...deployments].sort((a, b) => {
      const aVal = a.duration || 0;
      const bVal = b.duration || 0;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [deployments]);

  const rollback = useCallback(async (deploymentId, previousVersion) => {
    setError(null);
    const newDeployment = {
      id: `rollback_${Date.now()}`,
      status: 'success',
      environment: 'production',
      branch: 'main',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration: 120,
      rollback_from: deploymentId,
      rollback_to: previousVersion
    };

    setDeployments(prev => [newDeployment, ...prev]);
    return newDeployment;
  }, []);

  const cancel = useCallback(async (deploymentId) => {
    setError(null);
    setDeployments(prev =>
      prev.map(d =>
        d.id === deploymentId
          ? { ...d, status: 'cancelled', completed_at: new Date().toISOString() }
          : d
      )
    );
  }, []);

  const getDeploymentLogs = useCallback(async () => {
    return 'Deployment logs unavailable in test mode.';
  }, []);

  const canRollback = useCallback((deploymentId) => {
    const deployment = deployments.find(d => d.id === deploymentId);
    return Boolean(deployment && deployment.status === 'success');
  }, [deployments]);

  const canCancel = useCallback((deploymentId) => {
    const deployment = deployments.find(d => d.id === deploymentId);
    return Boolean(deployment && ['running', 'pending'].includes(deployment.status));
  }, [deployments]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const stats = useMemo(() => {
    const total = deployments.length;
    const successful = deployments.filter(d => d.status === 'success').length;
    const failed = deployments.filter(d => d.status === 'failed').length;
    const averageDuration = total === 0
      ? 0
      : deployments.reduce((sum, d) => sum + (d.duration || 0), 0) / total;
    const successRate = total === 0 ? 0 : (successful / total) * 100;

    return {
      total,
      successful,
      failed,
      averageDuration,
      successRate
    };
  }, [deployments]);

  return {
    deployments,
    loading,
    error,
    filters,
    currentPage,
    stats,
    filterByStatus,
    filterByEnvironment,
    filterByBranch,
    sortByDate,
    sortByDuration,
    rollback,
    cancel,
    getDeploymentLogs,
    canRollback,
    canCancel,
    refresh,
    clearError,
    setFilters,
    resetFilters,
    setPage: (page) => setCurrentPage(page)
  };
};

export default useDeployments;
