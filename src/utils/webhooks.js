/**
 * Webhooks System
 * Handles webhook registration, delivery, and management
 * 
 * @typedef {Object} Webhook
 * @property {string} id
 * @property {string} url
 * @property {string[]} events
 * @property {boolean} active
 * @property {string} secret
 * @property {Record<string, string>} headers
 * @property {RetryPolicy} retryPolicy
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} createdBy
 * 
 * @typedef {Object} RetryPolicy
 * @property {number} maxRetries
 * @property {number} delayMs
 * @property {number} backoffMultiplier
 * @property {number} maxDelayMs
 * 
 * @typedef {Object} WebhookDelivery
 * @property {string} id
 * @property {string} webhookId
 * @property {string} event
 * @property {Record<string, any>} payload
 * @property {'pending'|'success'|'failed'|'retrying'} status
 * @property {number} [statusCode]
 * @property {number} responseTime
 * @property {number} attempts
 * @property {Date} lastAttemptAt
 * @property {Date} [nextRetryAt]
 */

const webhookStore = new Map();
const webhookListeners = new Map();
const deliveryLogs = new Map();

/**
 * Create webhook
 */
export const createWebhook = (url, events = [], options = {}) => {
  const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const webhook = {
    id: webhookId,
    url,
    events,
    active: true,
    secret: generateSecret(),
    headers: options.headers || {},
    retryPolicy: {
      maxRetries: 5,
      delayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 60000,
      ...options.retryPolicy,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: getCurrentUserId(),
  };

  webhookStore.set(webhookId, webhook);
  deliveryLogs.set(webhookId, []);
  
  notifyWebhookListeners('webhook_created', webhook);
  
  return webhook;
};

/**
 * Get webhook
 */
export const getWebhook = (webhookId) => {
  return webhookStore.get(webhookId) || null;
};

/**
 * List webhooks
 */
export const listWebhooks = (filter = {}) => {
  let webhooks = Array.from(webhookStore.values());
  
  if (filter.event) {
    webhooks = webhooks.filter(w => w.events.includes(filter.event));
  }
  
  if (filter.active !== undefined) {
    webhooks = webhooks.filter(w => w.active === filter.active);
  }
  
  return webhooks;
};

/**
 * Update webhook
 */
export const updateWebhook = (webhookId, updates) => {
  const webhook = webhookStore.get(webhookId);
  if (!webhook) throw new Error('Webhook not found');

  const updatedWebhook = {
    ...webhook,
    ...updates,
    id: webhook.id,
    createdAt: webhook.createdAt,
    createdBy: webhook.createdBy,
    updatedAt: new Date(),
  };

  webhookStore.set(webhookId, updatedWebhook);
  notifyWebhookListeners('webhook_updated', updatedWebhook);
  
  return updatedWebhook;
};

/**
 * Delete webhook
 */
export const deleteWebhook = (webhookId) => {
  const webhook = webhookStore.get(webhookId);
  webhookStore.delete(webhookId);
  deliveryLogs.delete(webhookId);
  
  notifyWebhookListeners('webhook_deleted', webhook);
  
  return webhook;
};

/**
 * Toggle webhook active status
 */
export const toggleWebhook = (webhookId) => {
  const webhook = webhookStore.get(webhookId);
  if (!webhook) throw new Error('Webhook not found');

  webhook.active = !webhook.active;
  webhook.updatedAt = new Date();
  
  notifyWebhookListeners('webhook_toggled', webhook);
  
  return webhook;
};

/**
 * Trigger webhook event
 */
export const triggerWebhook = async (event, payload = {}) => {
  const webhooks = listWebhooks({ event, active: true });
  
  if (webhooks.length === 0) return;

  const deliveries = [];

  for (const webhook of webhooks) {
    const delivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookId: webhook.id,
      event,
      payload,
      status: 'pending',
      responseTime: 0,
      attempts: 0,
      lastAttemptAt: new Date(),
      timestamp: new Date(),
    };

    deliveries.push(delivery);
    deliveryLogs.get(webhook.id).push(delivery);

    // Send webhook asynchronously
    sendWebhookWithRetry(webhook, event, payload, delivery);
  }

  return deliveries;
};

/**
 * Send webhook with retry logic
 */
async function sendWebhookWithRetry(webhook, event, payload, delivery) {
  const signature = createSignature(webhook.secret, JSON.stringify(payload));
  const startTime = performance.now();

  for (let attempt = 0; attempt <= webhook.retryPolicy.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(
          webhook.retryPolicy.delayMs * Math.pow(webhook.retryPolicy.backoffMultiplier, attempt - 1),
          webhook.retryPolicy.maxDelayMs
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      delivery.attempts++;
      delivery.lastAttemptAt = new Date();
      delivery.status = 'retrying';

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-Id': webhook.id,
          'X-Webhook-Delivery': delivery.id,
          ...webhook.headers,
        },
        body: JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
          deliveryId: delivery.id,
        }),
        timeout: 30000,
      });

      delivery.responseTime = performance.now() - startTime;
      delivery.statusCode = response.status;

      if (response.ok) {
        delivery.status = 'success';
        notifyWebhookListeners('delivery_success', delivery);
        return;
      } else if (response.status >= 500 || response.status === 429) {
        // Retry on server error or rate limit
        continue;
      } else {
        delivery.status = 'failed';
        delivery.error = `HTTP ${response.status}`;
        notifyWebhookListeners('delivery_failed', delivery);
        return;
      }
    } catch (error) {
      delivery.responseTime = performance.now() - startTime;
      delivery.error = error.message;

      if (attempt === webhook.retryPolicy.maxRetries) {
        delivery.status = 'failed';
        notifyWebhookListeners('delivery_failed', delivery);
      } else {
        const nextDelay = Math.min(
          webhook.retryPolicy.delayMs * Math.pow(webhook.retryPolicy.backoffMultiplier, attempt),
          webhook.retryPolicy.maxDelayMs
        );
        delivery.nextRetryAt = new Date(Date.now() + nextDelay);
        delivery.status = 'retrying';
      }
    }
  }
}

/**
 * Get delivery logs for webhook
 */
export const getDeliveryLogs = (webhookId, limit = 100) => {
  const logs = deliveryLogs.get(webhookId) || [];
  return logs.slice(-limit).reverse();
};

/**
 * Get delivery log
 */
export const getDeliveryLog = (webhookId, deliveryId) => {
  const logs = deliveryLogs.get(webhookId) || [];
  return logs.find(l => l.id === deliveryId);
};

/**
 * Resend webhook delivery
 */
export const resendWebhook = async (webhookId, deliveryId) => {
  const webhook = webhookStore.get(webhookId);
  if (!webhook) throw new Error('Webhook not found');

  const logs = deliveryLogs.get(webhookId) || [];
  const delivery = logs.find(l => l.id === deliveryId);
  if (!delivery) throw new Error('Delivery not found');

  // Reset delivery for retry
  delivery.status = 'pending';
  delivery.attempts = 0;
  delivery.error = undefined;
  delivery.nextRetryAt = undefined;

  await sendWebhookWithRetry(webhook, delivery.event, delivery.payload, delivery);
  
  return delivery;
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (payload, secret) => {
  const signature = createSignature(secret, payload);
  return signature;
};

/**
 * Get webhook statistics
 */
export const getWebhookStats = (webhookId) => {
  const logs = deliveryLogs.get(webhookId) || [];
  
  return {
    totalDeliveries: logs.length,
    delivered: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    averageResponseTime: logs.length > 0 
      ? logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / logs.length 
      : 0,
    lastDelivery: logs[logs.length - 1],
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
function createSignature(secret, payload) {
  // Using simple hash for demo; use HMAC-SHA256 in production
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + payload);
  const hash = Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hash.substring(0, 64)}`;
}

/**
 * Generate webhook secret
 */
function generateSecret() {
  return `whsec_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  return localStorage.getItem('userId') || 'user_' + Date.now();
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
};
