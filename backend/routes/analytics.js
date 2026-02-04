/**
 * Analytics API Routes
 * 11 endpoints for reporting and predictions
 */

import express from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import authModule from '../middleware/auth.js';
import errorModule from '../middleware/errorHandler.js';
import {
  getUsageMetrics,
  getTeamAnalytics,
  getProductivityInsights,
  getCodeQualityTrends,
  getFeatureAdoption,
  getEngagementScore,
  getBenchmarks,
  getPredictionInputs,
  trackAnalyticsEvent
} from '../services/analytics.js';
import { generatePredictions } from '../services/predictions.js';
import { detectAnomalies } from '../services/anomalyDetector.js';
import { generateReport, buildDefaultCharts } from '../services/reportGenerator.js';

const router = express.Router();
const { verifyToken } = authModule;
const { asyncHandler } = errorModule;

router.use(verifyToken);

const timeRangeSchema = Joi.string().valid('1d', '7d', '30d', '90d', '1y', 'all-time').default('7d');

const validateQuery = (schema, req) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.details = error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message }));
    throw err;
  }
  return value;
};

const validateBody = (schema, req) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.details = error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message }));
    throw err;
  }
  return value;
};

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Report generation limit exceeded (10 per hour).'
});

/**
 * GET /api/analytics/usage
 * Usage metrics by time range
 */
router.get(
  '/usage',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema, appId: Joi.string().optional() }), req);
    const appId = req.query.appId || null;
    const usage = await getUsageMetrics({ range, appId });
    res.json({ success: true, ...usage });
  })
);

/**
 * GET /api/analytics/team/:teamId
 * Team productivity analytics
 */
router.get(
  '/team/:teamId',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema }), req);
    const analytics = await getTeamAnalytics({ teamId: req.params.teamId, range });
    res.json({ success: true, ...analytics });
  })
);

/**
 * GET /api/analytics/productivity
 * Productivity insights (AI-generated)
 */
router.get(
  '/productivity',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema }), req);
    const insights = await getProductivityInsights({ range, userId: req.user?.id });
    res.json({ success: true, ...insights });
  })
);

/**
 * GET /api/analytics/code-quality
 * Code quality trends over time
 */
router.get(
  '/code-quality',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema }), req);
    const trends = await getCodeQualityTrends({ range });
    res.json({ success: true, ...trends });
  })
);

/**
 * GET /api/analytics/features
 * Feature adoption tracking
 */
router.get(
  '/features',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema }), req);
    const features = await getFeatureAdoption({ range });
    res.json({ success: true, ...features });
  })
);

/**
 * GET /api/analytics/engagement/:userId
 * User engagement score
 */
router.get(
  '/engagement/:userId',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema }), req);
    const engagement = await getEngagementScore({ userId: req.params.userId, range });
    res.json({ success: true, ...engagement });
  })
);

/**
 * GET /api/analytics/benchmarks
 * Performance vs industry benchmarks
 */
router.get(
  '/benchmarks',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema, appId: Joi.string().optional() }), req);
    const appId = req.query.appId || null;
    const benchmarks = await getBenchmarks({ range, appId });
    res.json({ success: true, ...benchmarks });
  })
);

/**
 * GET /api/analytics/predictions
 * Predictive analytics (next 7/30 days)
 */
router.get(
  '/predictions',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema, appId: Joi.string().optional() }), req);
    const appId = req.query.appId || null;
    const inputs = await getPredictionInputs({ range, appId });
    const predictions = generatePredictions(inputs);
    res.json({ success: true, range, predictions });
  })
);

/**
 * GET /api/analytics/anomalies
 * Anomaly detection (statistical outliers)
 */
router.get(
  '/anomalies',
  asyncHandler(async (req, res) => {
    const { range } = validateQuery(Joi.object({ range: timeRangeSchema, appId: Joi.string().optional() }), req);
    const appId = req.query.appId || null;
    const usage = await getUsageMetrics({ range, appId });

    const usageSeries = usage.series.map(point => ({
      timestamp: point.bucket,
      value: point.totalRequests
    }));
    const errorSeries = usage.series.map(point => ({
      timestamp: point.bucket,
      value: point.errorCount
    }));
    const latencySeries = usage.series.map(point => ({
      timestamp: point.bucket,
      value: point.avgLatencyMs
    }));

    const anomalies = detectAnomalies({
      usageSeries,
      errorSeries,
      latencySeries,
      baseline7d: usageSeries.slice(-7),
      baseline30d: usageSeries.slice(-30)
    });

    res.json({ success: true, range, anomalies });
  })
);

/**
 * POST /api/analytics/reports
 * Generate custom report (PDF/CSV)
 */
router.post(
  '/reports',
  reportLimiter,
  asyncHandler(async (req, res) => {
    const payload = validateBody(
      Joi.object({
        format: Joi.string().valid('pdf', 'csv', 'json').default('pdf'),
        range: timeRangeSchema.default('30d'),
        appId: Joi.string().optional(),
        includePredictions: Joi.boolean().default(true),
        sections: Joi.array().items(Joi.string()).default(['usage', 'quality', 'features', 'engagement'])
      }),
      req
    );

    const usage = await getUsageMetrics({ range: payload.range, appId: payload.appId || null });
    const quality = await getCodeQualityTrends({ range: payload.range });
    const features = await getFeatureAdoption({ range: payload.range });
    const engagement = await getEngagementScore({ userId: req.user?.id, range: payload.range });
    const productivity = await getProductivityInsights({ range: payload.range, userId: req.user?.id });

    const metrics = {
      usage: usage.totals,
      quality: { direction: quality.direction, delta: quality.delta },
      features: { activeUsers: features.activeUsers, topFeatures: features.features.slice(0, 5) },
      engagement,
      productivity
    };

    const predictions = payload.includePredictions
      ? generatePredictions(await getPredictionInputs({ range: payload.range, appId: payload.appId || null }))
      : null;

    const charts = buildDefaultCharts({
      usageSeries: usage.series,
      latencySeries: usage.series
    });

    const report = await generateReport({
      title: 'AppForge Analytics Report',
      summary: {
        range: payload.range,
        generatedBy: req.user?.id
      },
      metrics,
      predictions,
      charts,
      format: payload.format
    });

    res.setHeader('Content-Type', report.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report.${report.extension}`);
    res.send(report.buffer);
  })
);

/**
 * POST /api/analytics/track
 * Track custom event
 */
router.post(
  '/track',
  asyncHandler(async (req, res) => {
    const payload = validateBody(
      Joi.object({
        eventType: Joi.string().max(100).required(),
        teamId: Joi.string().optional(),
        featureKey: Joi.string().max(120).optional(),
        value: Joi.number().optional(),
        durationMs: Joi.number().optional(),
        metadata: Joi.object().default({}),
        source: Joi.string().max(80).optional(),
        sessionId: Joi.string().max(120).optional()
      }),
      req
    );

    const result = await trackAnalyticsEvent({
      userId: req.user?.id,
      ...payload
    });

    res.status(201).json({ success: true, ...result });
  })
);

export default router;
