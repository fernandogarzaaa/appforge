import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Hook for application monitoring and real-time metrics
 * Integrates with error tracking, performance monitoring, and alerts
 */
export const useMonitoring = () => {
  const [metrics, setMetrics] = useState({
    health: 'unknown',
    uptime: 0,
    errorRate: 0,
    avgResponseTime: 0,
    activeUsers: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  });

  const [errors, setErrors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const metricsIntervalRef = useRef(null);
  const errorsIntervalRef = useRef(null);

  /**
   * Fetch current metrics
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get('/api/monitoring/metrics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setMetrics(response.data.metrics);
      return response.data.metrics;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Fetch recent errors
   */
  const fetchErrors = useCallback(async (limit = 20) => {
    try {
      const response = await axios.get('/api/monitoring/errors', {
        params: { limit },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setErrors(response.data.errors);
      return response.data.errors;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Fetch active alerts
   */
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await axios.get('/api/monitoring/alerts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setAlerts(response.data.alerts);
      return response.data.alerts;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(async (intervalMs = 5000) => {
    try {
      setIsLoading(true);
      setError(null);

      // Initial fetch
      await fetchMetrics();
      await fetchErrors();
      await fetchAlerts();

      setIsMonitoring(true);

      // Set up polling intervals
      metricsIntervalRef.current = setInterval(fetchMetrics, intervalMs);
      errorsIntervalRef.current = setInterval(fetchErrors, intervalMs * 2);

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMetrics, fetchErrors, fetchAlerts]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    if (errorsIntervalRef.current) clearInterval(errorsIntervalRef.current);
    setIsMonitoring(false);
  }, []);

  /**
   * Create alert rule
   */
  const createAlert = useCallback(async (alertRule) => {
    try {
      const response = await axios.post('/api/monitoring/alerts/create', alertRule, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.alert;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Update alert rule
   */
  const updateAlert = useCallback(async (alertId, updates) => {
    try {
      const response = await axios.patch(`/api/monitoring/alerts/${alertId}`, updates, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.alert;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Delete alert rule
   */
  const deleteAlert = useCallback(async (alertId) => {
    try {
      await axios.delete(`/api/monitoring/alerts/${alertId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get performance history
   */
  const getPerformanceHistory = useCallback(async (timeRange = '24h') => {
    try {
      const response = await axios.get('/api/monitoring/performance-history', {
        params: { timeRange },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.history;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get error breakdown
   */
  const getErrorBreakdown = useCallback(async () => {
    try {
      const response = await axios.get('/api/monitoring/error-breakdown', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.breakdown;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Report custom metric
   */
  const reportMetric = useCallback(async (metricName, value, tags = {}) => {
    try {
      await axios.post(
        '/api/monitoring/metrics/report',
        {
          name: metricName,
          value,
          tags,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      return true;
    } catch (err) {
      console.error('Failed to report metric:', err);
      return false;
    }
  }, []);

  /**
   * Get service health status
   */
  const getHealthStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/monitoring/health', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(async (errorId) => {
    try {
      await axios.post(
        `/api/monitoring/errors/${errorId}/clear`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      setErrors((prev) => prev.filter((e) => e.id !== errorId));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // State
    metrics,
    errors,
    alerts,
    isMonitoring,
    isLoading,
    error,

    // Methods
    fetchMetrics,
    fetchErrors,
    fetchAlerts,
    startMonitoring,
    stopMonitoring,
    createAlert,
    updateAlert,
    deleteAlert,
    getPerformanceHistory,
    getErrorBreakdown,
    reportMetric,
    getHealthStatus,
    clearError,
  };
};

export default useMonitoring;
