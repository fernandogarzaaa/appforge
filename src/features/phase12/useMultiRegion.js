import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for multi-region deployment management
 * @returns {Object} Multi-region utilities
 */
export const useMultiRegion = () => {
  const [regions, setRegions] = useState([
    { id: 'us-east-1', name: 'US East (Virginia)', latency: 45, status: 'healthy', load: 65 },
    { id: 'us-west-2', name: 'US West (Oregon)', latency: 78, status: 'healthy', load: 52 },
    { id: 'eu-west-1', name: 'EU West (Ireland)', latency: 120, status: 'healthy', load: 48 },
    { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', latency: 210, status: 'degraded', load: 85 },
  ]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Get nearest region based on latency
   */
  const getNearestRegion = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate latency test
      const sortedByLatency = [...regions].sort((a, b) => a.latency - b.latency);
      setSelectedRegion(sortedByLatency[0]);
      return sortedByLatency[0];
    } finally {
      setLoading(false);
    }
  }, [regions]);

  /**
   * Trigger failover to another region
   */
  const failover = useCallback(async (targetRegionId) => {
    setLoading(true);
    try {
      const targetRegion = regions.find(r => r.id === targetRegionId);
      if (targetRegion && targetRegion.status === 'healthy') {
        setSelectedRegion(targetRegion);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [regions]);

  useEffect(() => {
    getNearestRegion();
    const interval = setInterval(() => {
      setRegions(prev => prev.map(r => ({
        ...r,
        latency: r.latency + (Math.random() - 0.5) * 10,
        load: Math.max(0, Math.min(100, r.load + (Math.random() - 0.5) * 5)),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, [getNearestRegion]);

  return { regions, selectedRegion, loading, setSelectedRegion, getNearestRegion, failover };
};
