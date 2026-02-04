/**
 * Monitoring API Routes
 * 8 endpoints for metrics, alerts, and health
 */

import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import db from '../db/connection.js';
import authModule from '../middleware/auth.js';
import errorModule from '../middleware/errorHandler.js';
import { getCurrentMetrics, startMetricsAggregation } from '../services/metricsAggregator.js';
import { startAlertEvaluator } from '../workers/alertEvaluator.js';

const router = express.Router();
const { verifyToken } = authModule;
const { asyncHandler } = errorModule;

let initialized = false;
const initializeMonitoring = () => {
  if (initialized) return;
  startMetricsAggregation();
  startAlertEvaluator();
  initialized = true;
};

initializeMonitoring();

router.use(verifyToken);

const metricSchema = Joi.object({
  appId: Joi.string().required(),
  metricType: Joi.string().valid('error', 'latency', 'throughput', 'memory', 'cpu').required(),
  value: Joi.number().required(),
  unit: Joi.string().required(),
  endpoint: Joi.string().allow(null, ''),
  statusCode: Joi.number().integer().allow(null),
  tags: Joi.object().default({})
});

const alertSchema = Joi.object({
  appId: Joi.string().required(),
  name: Joi.string().required().max(200),
  metricKey: Joi.string().valid('uptime_percentage', 'error_rate', 'avg_response_time', 'cpu_usage', 'memory_rss', 'active_users').required(),
  conditionOperator: Joi.string().valid('gt', 'gte', 'lt', 'lte', 'eq', 'ne').required(),
  threshold: Joi.number().required(),
  cooldownSeconds: Joi.number().min(30).default(300),
  webhookUrl: Joi.string().uri().required(),
  webhookSecret: Joi.string().allow(null, ''),
  enabled: Joi.boolean().default(true)
});

const alertUpdateSchema = Joi.object({
  name: Joi.string().max(200),
  metricKey: Joi.string().valid('uptime_percentage', 'error_rate', 'avg_response_time', 'cpu_usage', 'memory_rss', 'active_users'),
  conditionOperator: Joi.string().valid('gt', 'gte', 'lt', 'lte', 'eq', 'ne'),
  threshold: Joi.number(),
  cooldownSeconds: Joi.number().min(30),
  webhookUrl: Joi.string().uri(),
  webhookSecret: Joi.string().allow(null, ''),
  enabled: Joi.boolean()
}).min(1);

const validateBody = (schema, req) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message }));
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.details = details;
    throw err;
  }
  return value;
};

/**
 * POST /api/monitoring/metrics
 * Report custom metric
 */
router.post(
  '/metrics',
  asyncHandler(async (req, res) => {
    const payload = validateBody(metricSchema, req);

    const id = crypto.randomUUID();

    await db.query(
      `INSERT INTO app_metrics
        (id, app_id, metric_type, value, unit, endpoint, status_code, tags, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        id,
        payload.appId,
        payload.metricType,
        payload.value,
        payload.unit,
        payload.endpoint || null,
        payload.statusCode || null,
        JSON.stringify(payload.tags || {})
      ]
    );

    res.status(201).json({ success: true, metricId: id });
  })
);

/**
 * GET /api/monitoring/metrics
 * Get current metrics
 */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const appId = req.query.appId || null;
    const metrics = await getCurrentMetrics({ appId });

    res.json({ success: true, metrics });
  })
);

/**
 * GET /api/monitoring/errors
 * Get error list grouped by type
 */
router.get(
  '/errors',
  asyncHandler(async (req, res) => {
    const appId = req.query.appId || null;

    const params = [];
    let query = `
      SELECT error_type, COUNT(*)::int AS count, MAX(last_occurrence) AS last_seen
      FROM app_errors
    `;

    if (appId) {
      params.push(appId);
      query += ` WHERE app_id = $${params.length}`;
    }

    query += ` GROUP BY error_type ORDER BY count DESC`;

    const result = await db.query(query, params);

    res.json({ success: true, errors: result.rows });
  })
);

/**
 * POST /api/monitoring/alerts
 * Create alert rule
 */
router.post(
  '/alerts',
  asyncHandler(async (req, res) => {
    const payload = validateBody(alertSchema, req);
    const id = crypto.randomUUID();

    await db.query(
      `INSERT INTO monitoring_alert_rules
        (id, app_id, name, metric_key, condition_operator, threshold, cooldown_seconds, webhook_url, webhook_secret, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        id,
        payload.appId,
        payload.name,
        payload.metricKey,
        payload.conditionOperator,
        payload.threshold,
        payload.cooldownSeconds,
        payload.webhookUrl,
        payload.webhookSecret || null,
        payload.enabled
      ]
    );

    res.status(201).json({ success: true, alertId: id });
  })
);

/**
 * GET /api/monitoring/alerts
 * List all alert rules
 */
router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const appId = req.query.appId || null;
    const params = [];
    let query = `SELECT * FROM monitoring_alert_rules`;

    if (appId) {
      params.push(appId);
      query += ` WHERE app_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);

    res.json({ success: true, alerts: result.rows });
  })
);

/**
 * PUT /api/monitoring/alerts/:id
 * Update alert rule
 */
router.put(
  '/alerts/:id',
  asyncHandler(async (req, res) => {
    const payload = validateBody(alertUpdateSchema, req);
    const ruleId = req.params.id;

    const fields = [];
    const values = [];
    let index = 1;

    const map = {
      name: 'name',
      metricKey: 'metric_key',
      conditionOperator: 'condition_operator',
      threshold: 'threshold',
      cooldownSeconds: 'cooldown_seconds',
      webhookUrl: 'webhook_url',
      webhookSecret: 'webhook_secret',
      enabled: 'enabled'
    };

    Object.entries(payload).forEach(([key, value]) => {
      if (map[key]) {
        fields.push(`${map[key]} = $${index}`);
        values.push(value);
        index += 1;
      }
    });

    fields.push(`updated_at = NOW()`);

    await db.query(
      `UPDATE monitoring_alert_rules
       SET ${fields.join(', ')}
       WHERE id = $${index}`,
      [...values, ruleId]
    );

    res.json({ success: true, alertId: ruleId });
  })
);

/**
 * DELETE /api/monitoring/alerts/:id
 * Delete alert rule
 */
router.delete(
  '/alerts/:id',
  asyncHandler(async (req, res) => {
    const ruleId = req.params.id;
    await db.query(`DELETE FROM monitoring_alert_rules WHERE id = $1`, [ruleId]);
    res.json({ success: true, alertId: ruleId });
  })
);

/**
 * GET /api/monitoring/health
 * Service health dashboard
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const metrics = await getCurrentMetrics({});
    res.json({
      success: true,
      status: metrics.database.healthy ? 'healthy' : 'degraded',
      metrics
    });
  })
);

export default router;
