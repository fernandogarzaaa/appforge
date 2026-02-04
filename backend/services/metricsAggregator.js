/**
 * Metrics Aggregator Service
 * Aggregates metrics in 1-minute windows for monitoring dashboards
 */

import os from 'os';
import crypto from 'crypto';
import db from '../db/connection.js';
import logger from '../utils/logger.js';

const ONE_MINUTE_MS = 60 * 1000;
const latestMetricsByApp = new Map();
const lastUpdatedByApp = new Map();
let aggregationInterval = null;

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateCpuUsagePercent = () => {
  const loadAvg = os.loadavg?.() || [0];
  const cpuCount = os.cpus?.().length || 1;
  const load = safeNumber(loadAvg[0]);
  return Math.min(100, Math.max(0, (load / cpuCount) * 100));
};

const calculateMemoryUsage = () => {
  const mem = process.memoryUsage();
  return {
    rssBytes: mem.rss,
    heapTotalBytes: mem.heapTotal,
    heapUsedBytes: mem.heapUsed,
    externalBytes: mem.external,
    arrayBuffersBytes: mem.arrayBuffers
  };
};

const getDbPoolHealth = () => {
  try {
    const pool = db.pool;
    if (!pool) return null;
    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  } catch (err) {
    logger.warn('Failed to read db pool health', { error: err.message });
    return null;
  }
};

const buildMetricsPayload = async ({ appId } = {}) => {
  const params = [];
  let query = `
    SELECT
      COUNT(*)::int AS total_count,
      COUNT(*) FILTER (WHERE metric_type = 'error')::int AS error_count,
      AVG(CASE WHEN metric_type = 'latency' THEN value END) AS avg_latency,
      AVG(CASE WHEN metric_type = 'memory' THEN value END) AS avg_memory,
      AVG(CASE WHEN metric_type = 'cpu' THEN value END) AS avg_cpu
    FROM app_metrics
    WHERE timestamp >= NOW() - INTERVAL '1 minute'
  `;

  if (appId) {
    params.push(appId);
    query += ` AND app_id = $${params.length}`;
  }

  const metricResult = await db.query(query, params);
  const metricRow = metricResult.rows[0] || {};

  const totalCount = safeNumber(metricRow.total_count, 0);
  const errorCount = safeNumber(metricRow.error_count, 0);
  const errorRate = totalCount > 0 ? errorCount / totalCount : 0;
  const uptimePercentage = totalCount > 0 ? (1 - errorRate) * 100 : 100;

  const activeSessionsQuery = `
    SELECT COUNT(*)::int AS active_users
    FROM sessions
    WHERE expires_at > NOW()
  `;
  const activeSessionsResult = await db.query(activeSessionsQuery);
  const activeUsers = safeNumber(activeSessionsResult.rows[0]?.active_users, 0);

  const memoryUsage = calculateMemoryUsage();
  const cpuUsagePercent = calculateCpuUsagePercent();

  const dbPoolHealth = getDbPoolHealth();
  const dbHealthy = await db.healthCheck();

  return {
    appId: appId || null,
    windowMinutes: 1,
    uptimePercentage: Number(uptimePercentage.toFixed(2)),
    errorRate: Number(errorRate.toFixed(4)),
    averageResponseTimeMs: Number(safeNumber(metricRow.avg_latency).toFixed(2)),
    memoryUsageBytes: memoryUsage,
    cpuUsagePercent: Number(cpuUsagePercent.toFixed(2)),
    activeUsers,
    database: {
      healthy: dbHealthy,
      pool: dbPoolHealth
    },
    generatedAt: new Date().toISOString(),
    totalRequests: totalCount,
    totalErrors: errorCount,
    metricHash: crypto.randomBytes(8).toString('hex')
  };
};

export const aggregateMetrics = async ({ appId } = {}) => {
  try {
    const metrics = await buildMetricsPayload({ appId });
    const key = appId || 'global';
    latestMetricsByApp.set(key, metrics);
    lastUpdatedByApp.set(key, Date.now());
    return metrics;
  } catch (error) {
    logger.error('Failed to aggregate metrics', { error: error.message });
    throw error;
  }
};

export const getCurrentMetrics = async ({ appId } = {}) => {
  const key = appId || 'global';
  const lastUpdatedAt = lastUpdatedByApp.get(key) || 0;
  const cached = latestMetricsByApp.get(key);
  if (cached && Date.now() - lastUpdatedAt < ONE_MINUTE_MS) {
    return cached;
  }
  return aggregateMetrics({ appId });
};

export const startMetricsAggregation = () => {
  if (aggregationInterval) return aggregationInterval;

  aggregationInterval = setInterval(async () => {
    try {
      await aggregateMetrics();
      logger.debug('Metrics aggregation completed');
    } catch (error) {
      logger.warn('Metrics aggregation failed', { error: error.message });
    }
  }, ONE_MINUTE_MS);

  return aggregationInterval;
};

export const stopMetricsAggregation = () => {
  if (aggregationInterval) {
    clearInterval(aggregationInterval);
    aggregationInterval = null;
  }
};
