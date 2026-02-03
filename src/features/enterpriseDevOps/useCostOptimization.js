import { useCallback, useState } from 'react';

export function useCostOptimization() {
  const [recommendations, setRecommendations] = useState([]);

  const analyzeCosts = useCallback((metrics) => {
    const recs = [
      {
        id: `rec_${Date.now()}`,
        title: 'Right-size compute instances',
        savings: metrics?.compute ? Math.round(metrics.compute * 0.15) : 120,
      },
      {
        id: `rec_${Date.now() + 1}`,
        title: 'Enable cache layer for read-heavy workloads',
        savings: metrics?.db ? Math.round(metrics.db * 0.08) : 80,
      },
    ];
    setRecommendations(recs);
    return recs;
  }, []);

  return { recommendations, analyzeCosts };
}
