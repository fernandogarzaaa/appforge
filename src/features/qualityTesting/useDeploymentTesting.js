import { useCallback, useState } from 'react';

export function useDeploymentTesting() {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthCheck = useCallback(async (endpoint) => {
    setIsRunning(true);
    const startedAt = Date.now();
    try {
      const response = await fetch(endpoint, { method: 'GET' });
      const result = {
        id: `health_${Date.now()}`,
        endpoint,
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        duration: Date.now() - startedAt,
      };
      setTests((prev) => [result, ...prev]);
      return result;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const registerRollbackPlan = useCallback((deploymentId, reason) => {
    const plan = {
      id: `rollback_${Date.now()}`,
      deploymentId,
      reason,
      createdAt: new Date().toISOString(),
    };
    setTests((prev) => [plan, ...prev]);
    return plan;
  }, []);

  return { tests, isRunning, runHealthCheck, registerRollbackPlan };
}
