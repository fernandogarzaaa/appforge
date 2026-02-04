/**
 * Anomaly Detector Service
 * Statistical anomaly detection for analytics streams
 */

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const computeStats = (values) => {
  if (!values.length) {
    return { mean: 0, std: 1 };
  }
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance) || 1;
  return { mean, std };
};

const zScore = (value, mean, std) => (value - mean) / std;

export const detectAnomalies = ({
  usageSeries = [],
  errorSeries = [],
  latencySeries = [],
  featureSeries = [],
  baseline7d = [],
  baseline30d = []
} = {}) => {
  const usageValues = usageSeries.map(point => safeNumber(point.value));
  const errorValues = errorSeries.map(point => safeNumber(point.value));
  const latencyValues = latencySeries.map(point => safeNumber(point.value));
  const featureValues = featureSeries.map(point => safeNumber(point.value));

  const usageStats = computeStats(usageValues);
  const errorStats = computeStats(errorValues);
  const latencyStats = computeStats(latencyValues);
  const featureStats = computeStats(featureValues);

  const baseline7Stats = computeStats(baseline7d.map(point => safeNumber(point.value)));
  const baseline30Stats = computeStats(baseline30d.map(point => safeNumber(point.value)));

  const buildFlags = (values, stats, label) =>
    values.map((value, idx) => {
      const z = zScore(value, stats.mean, stats.std);
      return {
        index: idx,
        value,
        zScore: Number(z.toFixed(2)),
        isAnomaly: Math.abs(z) > 2,
        label
      };
    });

  return {
    usage: buildFlags(usageValues, usageStats, 'usage_spike'),
    errorRate: buildFlags(errorValues, errorStats, 'error_rate_increase'),
    latency: buildFlags(latencyValues, latencyStats, 'performance_degradation'),
    featureAdoption: buildFlags(featureValues, featureStats, 'feature_adoption_outlier'),
    baselines: {
      sevenDay: baseline7Stats,
      thirtyDay: baseline30Stats
    }
  };
};
