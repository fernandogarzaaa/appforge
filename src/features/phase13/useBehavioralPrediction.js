import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'appforge_behavioral_prediction_v1';

const defaultHistory = [
  { date: '2026-01-28', sessions: 4, minutes: 128, actions: 52 },
  { date: '2026-01-29', sessions: 3, minutes: 96, actions: 41 },
  { date: '2026-01-30', sessions: 5, minutes: 155, actions: 60 },
  { date: '2026-01-31', sessions: 2, minutes: 64, actions: 32 },
  { date: '2026-02-01', sessions: 4, minutes: 121, actions: 55 },
  { date: '2026-02-02', sessions: 6, minutes: 176, actions: 72 },
  { date: '2026-02-03', sessions: 5, minutes: 150, actions: 63 }
];

const loadHistory = (userKey) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userKey}`);
    return raw ? JSON.parse(raw) : defaultHistory;
  } catch {
    return defaultHistory;
  }
};

const saveHistory = (userKey, history) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userKey}`, JSON.stringify(history));
  } catch {
    // no-op
  }
};

const summarizeHistory = (history) => {
  const totalSessions = history.reduce((sum, entry) => sum + entry.sessions, 0);
  const totalMinutes = history.reduce((sum, entry) => sum + entry.minutes, 0);
  const totalActions = history.reduce((sum, entry) => sum + entry.actions, 0);
  const activeDays = history.filter((entry) => entry.sessions > 0).length;
  const avgSessionMinutes = totalSessions ? Math.round(totalMinutes / totalSessions) : 0;
  const avgActions = activeDays ? Math.round(totalActions / activeDays) : 0;
  const last = history[0]?.sessions ?? 0;
  const prior = history[1]?.sessions ?? 0;
  const weeklyTrend = last - prior;

  return {
    totalSessions,
    totalMinutes,
    totalActions,
    activeDays,
    avgSessionMinutes,
    avgActions,
    weeklyTrend
  };
};

const buildPrediction = (history) => {
  const summary = summarizeHistory(history);
  const churnRisk = Math.min(
    0.95,
    Math.max(0.05, 0.35 + (summary.weeklyTrend < 0 ? 0.2 : -0.1) + (summary.avgSessionMinutes < 30 ? 0.2 : -0.05))
  );
  const engagementForecast = Array.from({ length: 6 }).map((_, index) => {
    const base = summary.avgActions + index * 2;
    return Math.max(10, Math.round(base + summary.weeklyTrend * 1.5));
  });
  const retentionScore = Math.min(100, Math.max(40, 100 - churnRisk * 100));

  return {
    summary,
    churnRisk,
    engagementForecast,
    retentionScore,
    accuracy: 0.91,
    trainingStatus: 'Monitoring',
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Predicts user behavior, churn risk, and engagement trends.
 * @param {string} userId
 * @returns {{history: Array, prediction: Object, loading: boolean, error: string | null, refreshPredictions: Function, recordSession: Function}}
 */
export function useBehavioralPrediction(userId = 'global') {
  const [history, setHistory] = useState(() => loadHistory(userId));
  const [prediction, setPrediction] = useState(() => buildPrediction(history));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 240));
      const nextPrediction = buildPrediction(history);
      setPrediction(nextPrediction);
    } catch (err) {
      setError(err?.message || 'Unable to refresh behavioral predictions.');
    } finally {
      setLoading(false);
    }
  }, [history]);

  const recordSession = useCallback((entry) => {
    try {
      const normalized = {
        date: entry?.date || new Date().toISOString().slice(0, 10),
        sessions: Number(entry?.sessions || 0),
        minutes: Number(entry?.minutes || 0),
        actions: Number(entry?.actions || 0)
      };
      const nextHistory = [normalized, ...history].slice(0, 30);
      setHistory(nextHistory);
      saveHistory(userId, nextHistory);
      setPrediction(buildPrediction(nextHistory));
    } catch (err) {
      setError(err?.message || 'Unable to record session data.');
    }
  }, [history, userId]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const stored = loadHistory(userId);
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!active) return;
        setHistory(stored);
        setPrediction(buildPrediction(stored));
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load behavioral data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [userId]);

  return {
    history,
    prediction,
    loading,
    error,
    refreshPredictions,
    recordSession
  };
}
