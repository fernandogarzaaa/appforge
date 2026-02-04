/**
 * Alert Evaluator Worker
 * Evaluates alert rules every 30 seconds and triggers webhooks
 */

import crypto from 'crypto';
import db from '../db/connection.js';
import logger from '../utils/logger.js';
import { getCurrentMetrics } from '../services/metricsAggregator.js';
import { deliverWebhook } from '../services/notifications.js';

const EVALUATION_INTERVAL_MS = 30 * 1000;
let evaluationInterval = null;

const evaluateCondition = (metricValue, operator, threshold) => {
  switch (operator) {
    case 'gt':
      return metricValue > threshold;
    case 'gte':
      return metricValue >= threshold;
    case 'lt':
      return metricValue < threshold;
    case 'lte':
      return metricValue <= threshold;
    case 'eq':
      return metricValue === threshold;
    case 'ne':
      return metricValue !== threshold;
    default:
      return false;
  }
};

const getMetricValue = (metrics, metricKey) => {
  const mapping = {
    uptime_percentage: metrics.uptimePercentage,
    error_rate: metrics.errorRate,
    avg_response_time: metrics.averageResponseTimeMs,
    cpu_usage: metrics.cpuUsagePercent,
    memory_rss: metrics.memoryUsageBytes?.rssBytes,
    active_users: metrics.activeUsers
  };

  return mapping[metricKey] ?? null;
};

const shouldTrigger = (rule, metricValue) => {
  if (metricValue === null || metricValue === undefined) return false;
  return evaluateCondition(metricValue, rule.condition_operator, rule.threshold);
};

const isInCooldown = (rule) => {
  if (!rule.last_triggered_at || !rule.cooldown_seconds) return false;
  const elapsed = Date.now() - new Date(rule.last_triggered_at).getTime();
  return elapsed < rule.cooldown_seconds * 1000;
};

const logAlertEvent = async ({ rule, payload, status, response }) => {
  try {
    await db.query(
      `INSERT INTO monitoring_alert_events
        (id, rule_id, app_id, status, payload, response, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        crypto.randomUUID(),
        rule.id,
        rule.app_id,
        status,
        JSON.stringify(payload),
        JSON.stringify(response || {})
      ]
    );
  } catch (error) {
    logger.warn('Failed to log alert event', { error: error.message });
  }
};

const updateRuleTrigger = async (ruleId) => {
  await db.query(
    `UPDATE monitoring_alert_rules
     SET last_triggered_at = NOW()
     WHERE id = $1`,
    [ruleId]
  );
};

const evaluateRules = async () => {
  const rulesResult = await db.query(
    `SELECT * FROM monitoring_alert_rules WHERE enabled = true`
  );

  if (!rulesResult.rows.length) return;

  const rules = rulesResult.rows;
  const metricsByApp = new Map();

  for (const rule of rules) {
    if (!metricsByApp.has(rule.app_id)) {
      const metrics = await getCurrentMetrics({ appId: rule.app_id });
      metricsByApp.set(rule.app_id, metrics);
    }
  }

  for (const rule of rules) {
    try {
      if (isInCooldown(rule)) continue;

      const metrics = metricsByApp.get(rule.app_id);
      const metricValue = getMetricValue(metrics, rule.metric_key);

      if (!shouldTrigger(rule, metricValue)) continue;

      const payload = {
        ruleId: rule.id,
        appId: rule.app_id,
        metricKey: rule.metric_key,
        operator: rule.condition_operator,
        threshold: rule.threshold,
        value: metricValue,
        triggeredAt: new Date().toISOString()
      };

      const webhookResult = await deliverWebhook({
        url: rule.webhook_url,
        payload,
        secret: rule.webhook_secret || null
      });

      await logAlertEvent({
        rule,
        payload,
        status: webhookResult.success ? 'sent' : 'failed',
        response: webhookResult
      });

      if (webhookResult.success) {
        await updateRuleTrigger(rule.id);
      }
    } catch (error) {
      logger.warn('Alert rule evaluation failed', { ruleId: rule.id, error: error.message });
    }
  }
};

export const startAlertEvaluator = () => {
  if (evaluationInterval) return evaluationInterval;

  evaluationInterval = setInterval(async () => {
    try {
      await evaluateRules();
    } catch (error) {
      logger.error('Alert evaluation cycle failed', { error: error.message });
    }
  }, EVALUATION_INTERVAL_MS);

  return evaluationInterval;
};

export const stopAlertEvaluator = () => {
  if (evaluationInterval) {
    clearInterval(evaluationInterval);
    evaluationInterval = null;
  }
};
