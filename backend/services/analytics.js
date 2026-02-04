/**
 * Analytics Service
 * Time-series analysis and aggregation
 */

import crypto from 'crypto';
import db from '../db/connection.js';
import logger from '../utils/logger.js';
import { getCurrentMetrics } from './metricsAggregator.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const TIME_RANGES = {
  '1d': { label: 'Last 24 hours', ms: 24 * 60 * 60 * 1000 },
  '7d': { label: 'Last 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  '30d': { label: 'Last 30 days', ms: 30 * 24 * 60 * 60 * 1000 },
  '90d': { label: 'Last 90 days', ms: 90 * 24 * 60 * 60 * 1000 },
  '1y': { label: 'Last 12 months', ms: 365 * 24 * 60 * 60 * 1000 },
  'all-time': { label: 'All time', ms: null }
};

const BUCKET_BY_RANGE = {
  '1d': 'hour',
  '7d': 'day',
  '30d': 'day',
  '90d': 'week',
  '1y': 'month',
  'all-time': 'month'
};

class AnalyticsCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = FIVE_MINUTES_MS) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  invalidate(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

const cache = new AnalyticsCache();

const normalizeRange = (range = '7d') => {
  return TIME_RANGES[range] ? range : '7d';
};

const getRangeDates = (rangeKey) => {
  const range = TIME_RANGES[rangeKey];
  const end = new Date();
  if (!range.ms) {
    return { start: null, end };
  }
  const start = new Date(Date.now() - range.ms);
  return { start, end };
};

const buildTimeFilter = (rangeKey, params, field = 'timestamp') => {
  const { start } = getRangeDates(rangeKey);
  if (!start) {
    return '';
  }
  params.push(start);
  return ` AND ${field} >= $${params.length}`;
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const runQuery = async (query, params, fallback, warnings, label) => {
  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    logger.warn('Analytics query failed', { label, error: error.message });
    if (warnings) {
      warnings.push({ label, message: error.message });
    }
    return fallback;
  }
};

const cachedResult = async (key, computeFn) => {
  const cached = cache.get(key);
  if (cached) {
    return { ...cached, cached: true };
  }
  const result = await computeFn();
  cache.set(key, result, FIVE_MINUTES_MS);
  return { ...result, cached: false };
};

export const trackAnalyticsEvent = async ({
  userId,
  teamId,
  eventType,
  featureKey,
  value,
  durationMs,
  metadata,
  source,
  sessionId
}) => {
  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO analytics_events
      (id, user_id, team_id, event_type, feature_key, value, duration_ms, metadata, source, session_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [
      id,
      userId,
      teamId || null,
      eventType,
      featureKey || null,
      value ?? null,
      durationMs ?? null,
      JSON.stringify(metadata || {}),
      source || null,
      sessionId || null
    ]
  );

  cache.invalidate('analytics:');

  return { eventId: id };
};

export const getUsageMetrics = async ({ range = '7d', appId = null } = {}) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:usage:${rangeKey}:${appId || 'all'}`;

  return cachedResult(cacheKey, async () => {
    const warnings = [];
    const params = [];
    let query = `
      SELECT
        DATE_TRUNC('${BUCKET_BY_RANGE[rangeKey]}', timestamp) AS bucket,
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE metric_type = 'error')::int AS error_count,
        AVG(CASE WHEN metric_type = 'latency' THEN value END) AS avg_latency,
        AVG(CASE WHEN metric_type = 'cpu' THEN value END) AS avg_cpu,
        AVG(CASE WHEN metric_type = 'memory' THEN value END) AS avg_memory
      FROM app_metrics
      WHERE 1=1
    `;

    if (appId) {
      params.push(appId);
      query += ` AND app_id = $${params.length}`;
    }

    query += buildTimeFilter(rangeKey, params);
    query += ` GROUP BY bucket ORDER BY bucket ASC`;

    const series = await runQuery(query, params, [], warnings, 'usage_series');

    const totalQueryParams = [];
    let totalQuery = `
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE metric_type = 'error')::int AS error_count,
        AVG(CASE WHEN metric_type = 'latency' THEN value END) AS avg_latency
      FROM app_metrics
      WHERE 1=1
    `;

    if (appId) {
      totalQueryParams.push(appId);
      totalQuery += ` AND app_id = $${totalQueryParams.length}`;
    }

    totalQuery += buildTimeFilter(rangeKey, totalQueryParams);

    const totalsRows = await runQuery(totalQuery, totalQueryParams, [], warnings, 'usage_totals');
    const totals = totalsRows[0] || {};
    const errorRate = totals.total_requests
      ? safeNumber(totals.error_count) / safeNumber(totals.total_requests)
      : 0;

    const realtime = await getCurrentMetrics({ appId }).catch(() => null);

    return {
      range: rangeKey,
      rangeLabel: TIME_RANGES[rangeKey].label,
      totals: {
        totalRequests: safeNumber(totals.total_requests),
        errorCount: safeNumber(totals.error_count),
        errorRate: Number(errorRate.toFixed(4)),
        avgLatencyMs: Number(safeNumber(totals.avg_latency).toFixed(2))
      },
      series: series.map(row => ({
        bucket: row.bucket,
        totalRequests: safeNumber(row.total_requests),
        errorCount: safeNumber(row.error_count),
        avgLatencyMs: Number(safeNumber(row.avg_latency).toFixed(2)),
        avgCpu: Number(safeNumber(row.avg_cpu).toFixed(2)),
        avgMemory: Number(safeNumber(row.avg_memory).toFixed(2))
      })),
      realtime,
      warnings
    };
  });
};

export const getTeamAnalytics = async ({ teamId, range = '30d' }) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:team:${teamId}:${rangeKey}`;

  return cachedResult(cacheKey, async () => {
    const warnings = [];
    const params = [teamId];
    let query = `
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'task_completed')::int AS tasks_completed,
        COUNT(DISTINCT user_id)::int AS active_members,
        AVG(CASE WHEN event_type = 'session_end' THEN duration_ms END) AS avg_session_ms
      FROM analytics_events
      WHERE team_id = $1
    `;

    query += buildTimeFilter(rangeKey, params, 'created_at');

    const rows = await runQuery(query, params, [], warnings, 'team_aggregate');
    const row = rows[0] || {};

    const membersRows = await runQuery(
      `SELECT COUNT(*)::int AS total_members FROM team_members WHERE team_id = $1`,
      [teamId],
      [{ total_members: 0 }],
      warnings,
      'team_members'
    );

    const totalMembers = safeNumber(membersRows[0]?.total_members);
    const tasksCompleted = safeNumber(row.tasks_completed);
    const sprintDays = TIME_RANGES[rangeKey].ms ? TIME_RANGES[rangeKey].ms / (24 * 60 * 60 * 1000) : 30;
    const velocity = sprintDays ? tasksCompleted / sprintDays : tasksCompleted;

    return {
      teamId,
      range: rangeKey,
      totals: {
        totalMembers,
        activeMembers: safeNumber(row.active_members),
        tasksCompleted,
        avgSessionMinutes: Number((safeNumber(row.avg_session_ms) / 60000).toFixed(2)),
        teamVelocity: Number(velocity.toFixed(2))
      },
      warnings
    };
  });
};

export const getProductivityInsights = async ({ range = '7d', userId = null } = {}) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:productivity:${rangeKey}:${userId || 'all'}`;

  return cachedResult(cacheKey, async () => {
    const warnings = [];
    const params = [];
    let query = `
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'feature_used')::int AS features_used,
        SUM(CASE WHEN event_type = 'session_end' THEN duration_ms END) AS total_session_ms
      FROM analytics_events
      WHERE 1=1
    `;

    if (userId) {
      params.push(userId);
      query += ` AND user_id = $${params.length}`;
    }

    query += buildTimeFilter(rangeKey, params, 'created_at');

    const rows = await runQuery(query, params, [], warnings, 'productivity_events');
    const row = rows[0] || {};

    const errorParams = [];
    let errorQuery = `SELECT COUNT(*)::int AS error_count FROM app_errors WHERE 1=1`;
    errorQuery += buildTimeFilter(rangeKey, errorParams, 'last_occurrence');
    const errorRows = await runQuery(errorQuery, errorParams, [], warnings, 'productivity_errors');

    const featuresUsed = safeNumber(row.features_used);
    const sessionMinutes = safeNumber(row.total_session_ms) / 60000;
    const errorCount = Math.max(1, safeNumber(errorRows[0]?.error_count));
    const productivityScore = (featuresUsed * sessionMinutes) / errorCount;

    let tier = 'medium';
    if (productivityScore >= 500) tier = 'high';
    if (productivityScore <= 100) tier = 'low';

    const insights = {
      high: 'Productivity is strong. Maintain momentum by standardizing workflows.',
      medium: 'Productivity is steady. Focus on reducing errors and increasing feature adoption.',
      low: 'Productivity is below target. Improve onboarding, reduce errors, and shorten session friction.'
    }[tier];

    return {
      range: rangeKey,
      featuresUsed,
      sessionMinutes: Number(sessionMinutes.toFixed(2)),
      errorCount,
      productivityScore: Number(productivityScore.toFixed(2)),
      tier,
      insights,
      warnings
    };
  });
};

export const getCodeQualityTrends = async ({ range = '30d' } = {}) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:code-quality:${rangeKey}`;

  return cachedResult(cacheKey, async () => {
    const warnings = [];
    const params = [];
    let query = `
      SELECT
        DATE_TRUNC('${BUCKET_BY_RANGE[rangeKey]}', created_at) AS bucket,
        AVG(CASE WHEN metric_key = 'complexity' THEN value END) AS complexity,
        AVG(CASE WHEN metric_key = 'test_coverage' THEN value END) AS coverage,
        COUNT(*) FILTER (WHERE metric_key = 'bug')::int AS bugs
      FROM analytics_events
      WHERE event_type = 'code_quality'
    `;

    query += buildTimeFilter(rangeKey, params, 'created_at');
    query += ` GROUP BY bucket ORDER BY bucket ASC`;

    const series = await runQuery(query, params, [], warnings, 'code_quality_series');

    const trendSeries = series.map(row => ({
      bucket: row.bucket,
      complexity: safeNumber(row.complexity),
      testCoverage: safeNumber(row.coverage),
      bugs: safeNumber(row.bugs),
      score: safeNumber(row.complexity) + safeNumber(row.coverage) - safeNumber(row.bugs)
    }));

    const first = trendSeries[0] || { score: 0 };
    const last = trendSeries[trendSeries.length - 1] || { score: 0 };
    const delta = last.score - first.score;

    return {
      range: rangeKey,
      direction: delta >= 0 ? 'up' : 'down',
      delta: Number(delta.toFixed(2)),
      series: trendSeries,
      warnings
    };
  });
};

export const getFeatureAdoption = async ({ range = '30d' } = {}) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:features:${rangeKey}`;

  return cachedResult(cacheKey, async () => {
    const warnings = [];
    const params = [];
    let query = `
      SELECT
        feature_key,
        COUNT(*)::int AS usage_count,
        COUNT(DISTINCT user_id)::int AS unique_users
      FROM analytics_events
      WHERE event_type = 'feature_used'
    `;

    query += buildTimeFilter(rangeKey, params, 'created_at');
    query += ` GROUP BY feature_key ORDER BY usage_count DESC`;

    const rows = await runQuery(query, params, [], warnings, 'feature_adoption');

    const userParams = [];
    let userQuery = `SELECT COUNT(DISTINCT user_id)::int AS active_users FROM analytics_events WHERE 1=1`;
    userQuery += buildTimeFilter(rangeKey, userParams, 'created_at');

    const userRows = await runQuery(userQuery, userParams, [], warnings, 'feature_active_users');
    const activeUsers = safeNumber(userRows[0]?.active_users);

    return {
      range: rangeKey,
      activeUsers,
      features: rows.map(row => ({
        featureKey: row.feature_key,
        usageCount: safeNumber(row.usage_count),
        uniqueUsers: safeNumber(row.unique_users),
        adoptionRate: activeUsers ? Number((safeNumber(row.unique_users) / activeUsers).toFixed(4)) : 0
      })),
      warnings
    };
  });
};

export const getEngagementScore = async ({ userId, range = '30d' }) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:engagement:${userId}:${rangeKey}`;

  return cachedResult(cacheKey, async () => {
    const warnings = [];
    const params = [userId];
    let query = `
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'session_end')::int AS sessions,
        COUNT(DISTINCT DATE_TRUNC('day', created_at))::int AS active_days,
        COUNT(DISTINCT feature_key)::int AS feature_diversity
      FROM analytics_events
      WHERE user_id = $1
    `;

    query += buildTimeFilter(rangeKey, params, 'created_at');

    const rows = await runQuery(query, params, [], warnings, 'engagement');
    const row = rows[0] || {};

    const totalDays = TIME_RANGES[rangeKey].ms ? TIME_RANGES[rangeKey].ms / (24 * 60 * 60 * 1000) : 30;
    const dauMauRatio = totalDays ? safeNumber(row.active_days) / totalDays : 0;
    const sessionFreq = totalDays ? safeNumber(row.sessions) / totalDays : 0;
    const featureDiversity = safeNumber(row.feature_diversity) || 1;

    const engagementScore = dauMauRatio * sessionFreq * featureDiversity;

    return {
      userId,
      range: rangeKey,
      sessions: safeNumber(row.sessions),
      activeDays: safeNumber(row.active_days),
      featureDiversity,
      engagementScore: Number(engagementScore.toFixed(2)),
      warnings
    };
  });
};

export const getBenchmarks = async ({ range = '30d', appId = null } = {}) => {
  const rangeKey = normalizeRange(range);
  const cacheKey = `analytics:benchmarks:${rangeKey}:${appId || 'all'}`;

  return cachedResult(cacheKey, async () => {
    const usage = await getUsageMetrics({ range: rangeKey, appId });
    const benchmark = {
      errorRate: 0.01,
      avgLatencyMs: 200,
      uptimePercentage: 99.9
    };

    const uptime = usage.realtime?.uptimePercentage ?? 99.9;

    return {
      range: rangeKey,
      benchmark,
      actual: {
        errorRate: usage.totals.errorRate,
        avgLatencyMs: usage.totals.avgLatencyMs,
        uptimePercentage: uptime
      },
      delta: {
        errorRate: Number((benchmark.errorRate - usage.totals.errorRate).toFixed(4)),
        avgLatencyMs: Number((benchmark.avgLatencyMs - usage.totals.avgLatencyMs).toFixed(2)),
        uptimePercentage: Number((uptime - benchmark.uptimePercentage).toFixed(2))
      }
    };
  });
};

export const getPredictionInputs = async ({ range = '30d', appId = null } = {}) => {
  const usage = await getUsageMetrics({ range, appId });
  const quality = await getCodeQualityTrends({ range });

  return {
    usageSeries: usage.series.map(row => ({
      timestamp: row.bucket,
      value: row.totalRequests
    })),
    qualityDelta: quality.delta,
    totalErrors: usage.totals.errorCount,
    avgLatencyMs: usage.totals.avgLatencyMs
  };
};
