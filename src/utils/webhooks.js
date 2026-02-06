/**
 * Webhooks System
 * Uses Base44 entities + serverless delivery for production readiness
 */

import { base44 } from '@/api/base44Client';

const webhookListeners = new Map();

const DEFAULT_RETRY_POLICY = {
  maxRetries: 5,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 60000,
};

const nowIso = () => new Date().toISOString();

/**
 * Reset all webhook data (local listeners only)
 */
export const resetWebhooks = () => {
  webhookListeners.clear();
};

/**
 * Create webhook
 */
export const createWebhook = async (url, events = [], options = {}) => {
  const user = await base44.auth.me().catch(() => null);
  const webhook = await base44.entities.Webhook.create({
    url,
    events,
    is_active: options.active !== false,
    secret: options.secret || generateSecret(),
    headers: options.headers || {},
    retry_policy: {
      ...DEFAULT_RETRY_POLICY,
      ...(options.retryPolicy || {})
    },
    created_at: nowIso(),
    updated_at: nowIso(),
    user_id: user?.email || null,
  });

  notifyWebhookListeners('webhook_created', webhook);
  return webhook;
};

/**
 * Get webhook
 */
export const getWebhook = async (webhookId) => {
  return base44.entities.Webhook.get(webhookId);
};

/**
 * List webhooks
 */
export const listWebhooks = async (filter = {}) => {
  const webhooks = await base44.entities.Webhook.list('-created_date', 200);
  let filtered = webhooks || [];

  if (filter.event) {
    filtered = filtered.filter(w => (w.events || []).includes(filter.event));
  }

  if (filter.active !== undefined) {
    filtered = filtered.filter(w => (w.is_active ?? w.active) === filter.active);
  }

  return filtered;
};

/**
 * Update webhook
 */
export const updateWebhook = async (webhookId, updates) => {
  const updatedWebhook = await base44.entities.Webhook.update(webhookId, {
    ...updates,
    updated_at: nowIso(),
  });
  notifyWebhookListeners('webhook_updated', updatedWebhook);
  return updatedWebhook;
};

/**
 * Delete webhook
 */
export const deleteWebhook = async (webhookId) => {
  const webhook = await base44.entities.Webhook.get(webhookId).catch(() => null);
  await base44.entities.Webhook.delete(webhookId);
  notifyWebhookListeners('webhook_deleted', webhook);
  return webhook;
};

/**
 * Toggle webhook active status
 */
export const toggleWebhook = async (webhookId) => {
  const webhook = await base44.entities.Webhook.get(webhookId);
  const updatedWebhook = await base44.entities.Webhook.update(webhookId, {
    is_active: !(webhook.is_active ?? webhook.active),
    updated_at: nowIso(),
  });
  notifyWebhookListeners('webhook_toggled', updatedWebhook);
  return updatedWebhook;
};

/**
 * Trigger webhook event
 */
export const triggerWebhook = async (event, payload = {}) => {
  const webhooks = await listWebhooks({ event, active: true });
  if (webhooks.length === 0) return [];

  const deliveries = [];

  for (const webhook of webhooks) {
    const response = await base44.functions.invoke('processWebhookDelivery', {
      webhook_id: webhook.id,
      event_type: event,
      payload,
    });

    const result = response?.data || response;
    deliveries.push(result?.delivery || result);
    notifyWebhookListeners(result?.success ? 'delivery_success' : 'delivery_failed', result);
  }

  return deliveries;
};

/**
 * Get delivery logs for webhook
 */
export const getDeliveryLogs = async (webhookId, limit = 100) => {
  const logs = await base44.entities.WebhookDelivery.filter(
    { webhook_id: webhookId },
    '-created_at',
    limit
  );
  return logs || [];
};

/**
 * Get delivery log
 */
export const getDeliveryLog = async (_webhookId, deliveryId) => {
  return base44.entities.WebhookDelivery.get(deliveryId);
};

/**
 * Resend webhook delivery
 */
export const resendWebhook = async (webhookId, deliveryId) => {
  const delivery = await base44.entities.WebhookDelivery.get(deliveryId);
  const response = await base44.functions.invoke('processWebhookDelivery', {
    webhook_id: webhookId,
    event_type: delivery?.event_type || delivery?.event || 'webhook.resend',
    payload: delivery?.payload || {},
    delivery_id: deliveryId,
  });
  return response?.data || response;
};

/**
 * Verify webhook signature (local helper)
 */
export const verifyWebhookSignature = async (payload, secret) => {
  return createSignature(secret, payload);
};

/**
 * Get webhook statistics
 */
export const getWebhookStats = async (webhookId) => {
  const logs = await getDeliveryLogs(webhookId, 200);
  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  return {
    totalDeliveries: logs.length,
    delivered: successCount,
    failed: failedCount,
    averageResponseTime: logs.length > 0
      ? logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length
      : 0,
    lastDelivery: logs[0] || null,
  };
};

/**
 * Subscribe to webhook events
 */
export const onWebhookEvent = (eventType, callback) => {
  if (!webhookListeners.has(eventType)) {
    webhookListeners.set(eventType, []);
  }
  webhookListeners.get(eventType).push(callback);

  return () => {
    const callbacks = webhookListeners.get(eventType);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  };
};

/**
 * Create signature for webhook
 */
async function createSignature(secret, payload) {
  if (!secret) return '';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${signatureHex}`;
}

/**
 * Generate webhook secret
 */
function generateSecret() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `whsec_${randomHex}`;
}

/**
 * Notify webhook listeners
 */
function notifyWebhookListeners(eventType, data) {
  const listeners = webhookListeners.get(eventType) || [];
  listeners.forEach(callback => callback(data));
}

export default {
  createWebhook,
  getWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  toggleWebhook,
  triggerWebhook,
  getDeliveryLogs,
  getDeliveryLog,
  resendWebhook,
  verifyWebhookSignature,
  getWebhookStats,
  onWebhookEvent,
  resetWebhooks,
};
