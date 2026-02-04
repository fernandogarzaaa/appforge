import { useCallback, useMemo, useState } from 'react';
import { useFeatureAnalytics } from '@/features/analytics/useFeatureAnalytics';

const STORAGE_KEY = 'appforge_team_productivity';

const defaultState = {
  sprints: [],
  bugsResolved: [],
  qualitySignals: [],
  capacity: { plannedHours: 0, actualHours: 0 }
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch {
    return defaultState;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // no-op
  }
};

export function useTeamProductivity() {
  const { analyticsEvents } = useFeatureAnalytics();
  const [state, setState] = useState(loadState);

  const updateState = useCallback((next) => {
    setState(next);
    saveState(next);
  }, []);

  const recordSprint = useCallback((sprint) => {
    const next = {
      ...state,
      sprints: [{ ...sprint, id: Date.now() }, ...state.sprints].slice(0, 50)
    };
    updateState(next);
  }, [state, updateState]);

  const recordBugResolution = useCallback((bug) => {
    const next = {
      ...state,
      bugsResolved: [{ ...bug, id: Date.now() }, ...state.bugsResolved].slice(0, 200)
    };
    updateState(next);
  }, [state, updateState]);

  const recordQualitySignal = useCallback((signal) => {
    const next = {
      ...state,
      qualitySignals: [{ ...signal, id: Date.now() }, ...state.qualitySignals].slice(0, 200)
    };
    updateState(next);
  }, [state, updateState]);

  const setCapacity = useCallback((capacity) => {
    const next = { ...state, capacity };
    updateState(next);
  }, [state, updateState]);

  const velocity = useMemo(() => {
    if (!state.sprints.length) return 0;
    const total = state.sprints.reduce((sum, sprint) => sum + (sprint.completedPoints || 0), 0);
    return Math.round((total / state.sprints.length) * 10) / 10;
  }, [state.sprints]);

  const avgBugResolutionHours = useMemo(() => {
    if (!state.bugsResolved.length) return 0;
    const total = state.bugsResolved.reduce((sum, bug) => sum + (bug.hours || 0), 0);
    return Math.round((total / state.bugsResolved.length) * 10) / 10;
  }, [state.bugsResolved]);

  const qualityTrend = useMemo(() => {
    if (!state.qualitySignals.length) return 0;
    const latest = state.qualitySignals[0]?.score || 0;
    const oldest = state.qualitySignals[state.qualitySignals.length - 1]?.score || 0;
    return Math.round((latest - oldest) * 10) / 10;
  }, [state.qualitySignals]);

  const engagementScore = useMemo(() => {
    if (!analyticsEvents?.length) return 0;
    const last7d = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = analyticsEvents.filter((event) => new Date(event.timestamp).getTime() >= last7d);
    return Math.min(100, Math.round((recent.length / 50) * 100));
  }, [analyticsEvents]);

  const capacityUtilization = useMemo(() => {
    if (!state.capacity.plannedHours) return 0;
    return Math.round((state.capacity.actualHours / state.capacity.plannedHours) * 100);
  }, [state.capacity]);

  return {
    state,
    recordSprint,
    recordBugResolution,
    recordQualitySignal,
    setCapacity,
    velocity,
    avgBugResolutionHours,
    qualityTrend,
    engagementScore,
    capacityUtilization
  };
}
