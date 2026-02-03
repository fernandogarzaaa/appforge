import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_perf_baselines';

const load = () => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
};

const save = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export function usePerformanceRegression(projectId = 'default') {
  const [baselines, setBaselines] = useState(() => load());

  useEffect(() => {
    save(baselines);
  }, [baselines]);

  const setBaseline = useCallback((metrics) => {
    setBaselines((prev) => ({
      ...prev,
      [projectId]: {
        ...metrics,
        capturedAt: new Date().toISOString(),
      }
    }));
  }, [projectId]);

  const compareToBaseline = useCallback((metrics) => {
    const baseline = baselines[projectId];
    if (!baseline) return null;

    return Object.keys(metrics).map((key) => ({
      metric: key,
      baseline: baseline[key],
      current: metrics[key],
      delta: metrics[key] - baseline[key],
      percentChange: baseline[key] ? ((metrics[key] - baseline[key]) / baseline[key]) * 100 : 0,
    }));
  }, [baselines, projectId]);

  return { baseline: baselines[projectId], setBaseline, compareToBaseline };
}
