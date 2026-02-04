import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_code_quality_prediction_v1';

const defaultMetrics = {
  coverage: 82,
  lintIssues: 14,
  complexity: 2.6,
  openBugs: 8,
  duplicationRate: 4.2
};

const loadMetrics = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultMetrics;
  } catch {
    return defaultMetrics;
  }
};

const saveMetrics = (metrics) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // no-op
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const scoreQuality = (metrics) => {
  const rawScore =
    40 +
    metrics.coverage * 0.5 -
    metrics.lintIssues * 1.6 -
    metrics.complexity * 6.5 -
    metrics.openBugs * 2.2 -
    metrics.duplicationRate * 1.4;
  return clamp(Math.round(rawScore), 0, 100);
};

const estimateBugRisk = (metrics) => {
  const risk = (metrics.openBugs * 6 + metrics.lintIssues * 0.8 + metrics.complexity * 12 + metrics.duplicationRate * 2) / 100;
  return clamp(Number(risk.toFixed(2)), 0.05, 0.95);
};

/**
 * ML-inspired prediction for code quality, bug risk, and score modeling.
 * @returns {{metrics: Object, score: number, bugRisk: number, loading: boolean, error: string | null, trainingStatus: string, modelVersion: string, updateMetrics: Function, refreshModel: Function}}
 */
export function useCodeQualityPrediction() {
  const [metrics, setMetrics] = useState(loadMetrics);
  const [score, setScore] = useState(() => scoreQuality(metrics));
  const [bugRisk, setBugRisk] = useState(() => estimateBugRisk(metrics));
  const [trainingStatus, setTrainingStatus] = useState('Training');
  const [modelVersion, setModelVersion] = useState('Q3-2026.4');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshModel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 260));
      setScore(scoreQuality(metrics));
      setBugRisk(estimateBugRisk(metrics));
      setTrainingStatus('Monitoring');
      setModelVersion('Q3-2026.4');
    } catch (err) {
      setError(err?.message || 'Unable to refresh quality predictions.');
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  const updateMetrics = useCallback((updates) => {
    try {
      const next = { ...metrics, ...updates };
      setMetrics(next);
      saveMetrics(next);
      setScore(scoreQuality(next));
      setBugRisk(estimateBugRisk(next));
    } catch (err) {
      setError(err?.message || 'Unable to update quality metrics.');
    }
  }, [metrics]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const stored = loadMetrics();
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!active) return;
        setMetrics(stored);
        setScore(scoreQuality(stored));
        setBugRisk(estimateBugRisk(stored));
        setTrainingStatus('Ready');
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load code quality data.');
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
    metrics,
    score,
    bugRisk,
    loading,
    error,
    trainingStatus,
    modelVersion,
    updateMetrics,
    refreshModel
  };
}
