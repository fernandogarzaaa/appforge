/**
 * Predictions Service
 * ML-ready predictive analytics
 */

import logger from '../utils/logger.js';

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const exponentialSmoothing = (series, alpha = 0.4) => {
  if (!series.length) return [];
  const smoothed = [series[0]];
  for (let i = 1; i < series.length; i += 1) {
    smoothed.push(alpha * series[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
};

const linearRegression = (series) => {
  if (series.length < 2) {
    return { slope: 0, intercept: series[0] || 0 };
  }
  const n = series.length;
  const sumX = series.reduce((acc, _, idx) => acc + idx, 0);
  const sumY = series.reduce((acc, val) => acc + val, 0);
  const sumXY = series.reduce((acc, val, idx) => acc + idx * val, 0);
  const sumX2 = series.reduce((acc, _, idx) => acc + idx * idx, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const forecastLinear = (series, horizon) => {
  const { slope, intercept } = linearRegression(series);
  const startIndex = series.length;
  const forecast = [];
  for (let i = 0; i < horizon; i += 1) {
    forecast.push(intercept + slope * (startIndex + i));
  }
  return forecast;
};

const zScoreAnomalies = (series, threshold = 2) => {
  if (!series.length) return [];
  const mean = series.reduce((acc, val) => acc + val, 0) / series.length;
  const variance = series.reduce((acc, val) => acc + (val - mean) ** 2, 0) / series.length;
  const std = Math.sqrt(variance) || 1;
  return series.map((value, idx) => {
    const z = (value - mean) / std;
    return {
      index: idx,
      value,
      zScore: Number(z.toFixed(2)),
      isAnomaly: Math.abs(z) > threshold
    };
  });
};

export const generatePredictions = ({ usageSeries = [], qualityDelta = 0, totalErrors = 0, avgLatencyMs = 0 } = {}) => {
  try {
    const values = usageSeries.map(point => safeNumber(point.value));
    const smoothing = exponentialSmoothing(values);
    const forecast7 = forecastLinear(values, 7);
    const forecast30 = forecastLinear(values, 30);

    const trendDirection = qualityDelta >= 0 ? 'up' : 'down';
    const completionEstimateDays = avgLatencyMs > 0 ? Math.max(7, Math.round(100000 / avgLatencyMs)) : 30;

    const bugPredictionScore = Math.min(1, safeNumber(totalErrors) / 1000 + Math.max(0, avgLatencyMs / 1000));

    return {
      usage: {
        smoothing,
        next7Days: forecast7.map(value => Number(value.toFixed(2))),
        next30Days: forecast30.map(value => Number(value.toFixed(2)))
      },
      codeQuality: {
        direction: trendDirection,
        delta: Number(qualityDelta.toFixed(2))
      },
      completionEstimate: {
        days: completionEstimateDays,
        confidence: avgLatencyMs > 0 ? 'medium' : 'low'
      },
      bugPrediction: {
        score: Number(bugPredictionScore.toFixed(2)),
        risk: bugPredictionScore > 0.7 ? 'high' : bugPredictionScore > 0.4 ? 'medium' : 'low'
      }
    };
  } catch (error) {
    logger.error('Prediction generation failed', { error: error.message });
    throw error;
  }
};

export const detectSeriesAnomalies = (series, threshold = 2) => {
  const values = series.map(point => safeNumber(point.value));
  return zScoreAnomalies(values, threshold);
};
