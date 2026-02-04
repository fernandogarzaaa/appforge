import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for auto-scaling management
 * @returns {Object} Auto-scaling utilities
 */
export const useAutoScaling = () => {
  const [scalingConfig, setScalingConfig] = useState({
    minInstances: 2,
    maxInstances: 20,
    targetCPU: 70,
    targetMemory: 80,
    cooldownPeriod: 300,
  });
  const [currentScale, setCurrentScale] = useState({
    instances: 5,
    cpu: 65,
    memory: 72,
    requestsPerSecond: 1250,
  });
  const [scalingHistory, setScalingHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Trigger manual scaling
   */
  const scaleManually = useCallback(async (targetInstances) => {
    setLoading(true);
    try {
      if (targetInstances >= scalingConfig.minInstances && targetInstances <= scalingConfig.maxInstances) {
        setCurrentScale(prev => ({ ...prev, instances: targetInstances }));
        setScalingHistory(prev => [...prev, {
          timestamp: new Date().toISOString(),
          from: currentScale.instances,
          to: targetInstances,
          trigger: 'manual',
        }]);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [scalingConfig, currentScale.instances]);

  /**
   * Update scaling configuration
   */
  const updateConfig = useCallback((config) => {
    setScalingConfig(prev => ({ ...prev, ...config }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScale(prev => ({
        ...prev,
        cpu: Math.max(20, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(100, prev.memory + (Math.random() - 0.5) * 8)),
        requestsPerSecond: Math.max(500, Math.min(3000, prev.requestsPerSecond + (Math.random() - 0.5) * 200)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { scalingConfig, currentScale, scalingHistory, loading, scaleManually, updateConfig };
};
