import { useCallback, useState } from 'react';

export function useResourceAllocator() {
  const [plans, setPlans] = useState([]);

  const recommend = useCallback((metrics) => {
    const plan = {
      id: `plan_${Date.now()}`,
      cpu: metrics?.cpu > 70 ? 'scale up' : 'stable',
      memory: metrics?.memory > 80 ? 'scale up' : 'stable',
      createdAt: new Date().toISOString(),
    };
    setPlans((prev) => [plan, ...prev]);
    return plan;
  }, []);

  return { plans, recommend };
}
