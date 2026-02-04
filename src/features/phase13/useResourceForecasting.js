import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_resource_forecast_v1';

const defaultUsage = {
  cpu: 62,
  memory: 68,
  storage: 54,
  nodes: 12
};

const loadUsage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultUsage;
  } catch {
    return defaultUsage;
  }
};

const saveUsage = (usage) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // no-op
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildForecast = (usage) => {
  return Array.from({ length: 6 }).map((_, index) => {
    const growth = 2 + index * 1.4;
    return {
      month: `M+${index + 1}`,
      cpu: clamp(Math.round(usage.cpu + growth * 1.6), 0, 100),
      memory: clamp(Math.round(usage.memory + growth * 1.3), 0, 100),
      storage: clamp(Math.round(usage.storage + growth * 1.1), 0, 100)
    };
  });
};

const buildPlan = (forecast) => {
  const peakCpu = Math.max(...forecast.map((item) => item.cpu));
  const peakMemory = Math.max(...forecast.map((item) => item.memory));
  const peakStorage = Math.max(...forecast.map((item) => item.storage));
  const riskLevel = peakCpu > 85 || peakMemory > 85 || peakStorage > 85 ? 'High' : peakCpu > 75 ? 'Moderate' : 'Low';

  return {
    peakCpu,
    peakMemory,
    peakStorage,
    riskLevel,
    recommendedNodes: riskLevel === 'High' ? 18 : riskLevel === 'Moderate' ? 15 : 12
  };
};

/**
 * Forecasts CPU, memory, and storage capacity requirements.
 * @returns {{usage: Object, forecast: Array, capacityPlan: Object, loading: boolean, error: string | null, refreshForecast: Function, updateUsage: Function}}
 */
export function useResourceForecasting() {
  const [usage, setUsage] = useState(loadUsage);
  const [forecast, setForecast] = useState(() => buildForecast(usage));
  const [capacityPlan, setCapacityPlan] = useState(() => buildPlan(forecast));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 240));
      const nextForecast = buildForecast(usage);
      setForecast(nextForecast);
      setCapacityPlan(buildPlan(nextForecast));
    } catch (err) {
      setError(err?.message || 'Unable to refresh resource forecast.');
    } finally {
      setLoading(false);
    }
  }, [usage]);

  const updateUsage = useCallback((updates) => {
    try {
      const next = { ...usage, ...updates };
      setUsage(next);
      saveUsage(next);
      const nextForecast = buildForecast(next);
      setForecast(nextForecast);
      setCapacityPlan(buildPlan(nextForecast));
    } catch (err) {
      setError(err?.message || 'Unable to update resource usage.');
    }
  }, [usage]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const stored = loadUsage();
        await new Promise((resolve) => setTimeout(resolve, 220));
        if (!active) return;
        const nextForecast = buildForecast(stored);
        setUsage(stored);
        setForecast(nextForecast);
        setCapacityPlan(buildPlan(nextForecast));
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load resource usage.');
      } finally {
        if (active) setLoading(false);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  return {
    usage,
    forecast,
    capacityPlan,
    loading,
    error,
    refreshForecast,
    updateUsage
  };
}
