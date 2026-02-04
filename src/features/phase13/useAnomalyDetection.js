import { useCallback, useEffect, useState } from 'react';

const initialThresholds = {
  cpu: 85,
  memory: 82,
  errorRate: 3
};

const createAlert = (type, value, threshold) => ({
  id: `${type}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  type,
  value,
  threshold,
  severity: value > threshold + 10 ? 'critical' : 'warning',
  status: 'open',
  createdAt: new Date().toISOString()
});

/**
 * Real-time anomaly detection with configurable thresholds.
 * @returns {{alerts: Array, thresholds: Object, loading: boolean, error: string | null, updateThreshold: Function, acknowledgeAlert: Function, clearAlerts: Function}}
 */
export function useAnomalyDetection() {
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateThreshold = useCallback((key, value) => {
    try {
      setThresholds((prev) => ({ ...prev, [key]: Number(value) }));
    } catch (err) {
      setError(err?.message || 'Unable to update thresholds.');
    }
  }, []);

  const acknowledgeAlert = useCallback((alertId) => {
    try {
      setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert)));
    } catch (err) {
      setError(err?.message || 'Unable to acknowledge alert.');
    }
  }, []);

  const clearAlerts = useCallback(() => {
    try {
      setAlerts([]);
    } catch (err) {
      setError(err?.message || 'Unable to clear alerts.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    let intervalId;

    const startStream = async () => {
      setLoading(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!active) return;
        intervalId = setInterval(() => {
          try {
            const cpuSpike = Math.random() * 100;
            const memorySpike = Math.random() * 100;
            const errorRate = Math.random() * 6;
            const nextAlerts = [];

            if (cpuSpike > thresholds.cpu) {
              nextAlerts.push(createAlert('CPU', Math.round(cpuSpike), thresholds.cpu));
            }
            if (memorySpike > thresholds.memory) {
              nextAlerts.push(createAlert('Memory', Math.round(memorySpike), thresholds.memory));
            }
            if (errorRate > thresholds.errorRate) {
              nextAlerts.push(createAlert('Error Rate', Number(errorRate.toFixed(1)), thresholds.errorRate));
            }

            if (nextAlerts.length) {
              setAlerts((prev) => [...nextAlerts, ...prev].slice(0, 25));
            }
          } catch (err) {
            setError(err?.message || 'Anomaly stream error.');
          }
        }, 4000);
      } catch (err) {
        if (active) setError(err?.message || 'Unable to start anomaly detection.');
      } finally {
        if (active) setLoading(false);
      }
    };

    startStream();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [thresholds.cpu, thresholds.errorRate, thresholds.memory]);

  return {
    alerts,
    thresholds,
    loading,
    error,
    updateThreshold,
    acknowledgeAlert,
    clearAlerts
  };
}
