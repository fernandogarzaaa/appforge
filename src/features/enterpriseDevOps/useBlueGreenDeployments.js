import { useCallback, useState } from 'react';

export function useBlueGreenDeployments() {
  const [deployments, setDeployments] = useState([]);

  const createDeployment = useCallback((version, environment = 'production') => {
    const deployment = {
      id: `bg_${Date.now()}`,
      version,
      environment,
      activeColor: 'blue',
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
    setDeployments((prev) => [deployment, ...prev]);
    return deployment;
  }, []);

  const switchTraffic = useCallback((deploymentId) => {
    setDeployments((prev) =>
      prev.map((deployment) =>
        deployment.id === deploymentId
          ? {
              ...deployment,
              activeColor: deployment.activeColor === 'blue' ? 'green' : 'blue',
              status: 'switched',
            }
          : deployment
      )
    );
  }, []);

  return { deployments, createDeployment, switchTraffic };
}
