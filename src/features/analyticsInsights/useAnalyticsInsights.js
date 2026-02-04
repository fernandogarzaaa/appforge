import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for analytics and insights
 * Provides usage metrics, team analytics, and predictive insights
 */
export const useAnalyticsInsights = () => {
  const [usageData, setUsageData] = useState(null);
  const [teamAnalytics, setTeamAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get usage metrics
   */
  const getUsageMetrics = useCallback(async (timeRange = '30d') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get('/api/analytics/usage', {
        params: { timeRange },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setUsageData(response.data.metrics);
      return response.data.metrics;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get team analytics
   */
  const getTeamAnalytics = useCallback(async (teamId, timeRange = '30d') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/team/${teamId}`, {
        params: { timeRange },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setTeamAnalytics(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get productivity insights
   */
  const getProductivityInsights = useCallback(async (timeRange = '7d') => {
    try {
      const response = await axios.get('/api/analytics/productivity-insights', {
        params: { timeRange },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setInsights(response.data.insights);
      return response.data.insights;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get code quality trends
   */
  const getCodeQualityTrends = useCallback(async (timeRange = '30d') => {
    try {
      const response = await axios.get('/api/analytics/code-quality', {
        params: { timeRange },
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
   * Get feature adoption metrics
   */
  const getFeatureAdoption = useCallback(async () => {
    try {
      const response = await axios.get('/api/analytics/feature-adoption', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.features;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get user engagement metrics
   */
  const getUserEngagement = useCallback(async (userId, timeRange = '30d') => {
    try {
      const response = await axios.get(`/api/analytics/engagement/${userId}`, {
        params: { timeRange },
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
   * Get performance benchmarks
   */
  const getBenchmarks = useCallback(async () => {
    try {
      const response = await axios.get('/api/analytics/benchmarks', {
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
   * Get predictive insights (ML-based)
   */
  const getPredictiveInsights = useCallback(async (model = 'default') => {
    try {
      setIsLoading(true);

      const response = await axios.get('/api/analytics/predictive', {
        params: { model },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setPredictions(response.data.predictions);
      return response.data.predictions;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get anomaly detection results
   */
  const getAnomalies = useCallback(async (timeRange = '7d') => {
    try {
      const response = await axios.get('/api/analytics/anomalies', {
        params: { timeRange },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data.anomalies;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Generate custom report
   */
  const generateReport = useCallback(async (reportConfig) => {
    try {
      setIsLoading(true);

      const response = await axios.post('/api/analytics/reports/generate', reportConfig, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Export analytics data
   */
  const exportAnalytics = useCallback(async (format = 'csv', filters = {}) => {
    try {
      const response = await axios.get('/api/analytics/export', {
        params: { format, ...filters },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        responseType: format === 'pdf' ? 'blob' : 'json',
      });

      if (format === 'pdf' || format === 'csv') {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Track custom event
   */
  const trackEvent = useCallback(async (eventName, eventData = {}) => {
    try {
      await axios.post(
        '/api/analytics/events/track',
        {
          name: eventName,
          data: eventData,
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
      console.error('Failed to track event:', err);
      return false;
    }
  }, []);

  /**
   * Get dashboard data (all key metrics)
   */
  const getDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [usage, team, insights, predictions, anomalies] = await Promise.all([
        getUsageMetrics(),
        getTeamAnalytics(''),
        getProductivityInsights(),
        getPredictiveInsights(),
        getAnomalies(),
      ]);

      return {
        usage,
        team,
        insights,
        predictions,
        anomalies,
      };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUsageMetrics, getTeamAnalytics, getProductivityInsights, getPredictiveInsights, getAnomalies]);

  return {
    // State
    usageData,
    teamAnalytics,
    insights,
    predictions,
    isLoading,
    error,

    // Methods
    getUsageMetrics,
    getTeamAnalytics,
    getProductivityInsights,
    getCodeQualityTrends,
    getFeatureAdoption,
    getUserEngagement,
    getBenchmarks,
    getPredictiveInsights,
    getAnomalies,
    generateReport,
    exportAnalytics,
    trackEvent,
    getDashboardData,
  };
};

export default useAnalyticsInsights;
