import { useMemo } from 'react';

const linearRegression = (points) => {
  if (points.length < 2) return { slope: 0, intercept: 0 };
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

export function usePredictiveAnalytics(series = []) {
  const predictions = useMemo(() => {
    if (!series.length) return [];
    const points = series.map((value, index) => ({ x: index, y: value }));
    const { slope, intercept } = linearRegression(points);
    return Array.from({ length: 7 }).map((_, idx) => {
      const x = series.length + idx;
      return Math.round((slope * x + intercept) * 10) / 10;
    });
  }, [series]);

  const trend = useMemo(() => {
    if (series.length < 2) return 'stable';
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'stable';
  }, [series]);

  return {
    predictions,
    trend
  };
}
