/**
 * Webhook Service with MongoDB persistence
 */

const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');

async function registerWebhook({ url, events, secret, userId, tenantId }) {
  const webhook = await Webhook.create({
    url,
    events,
    secret,
    userId,
    tenantId,
  });

  return {
    id: webhook._id.toString(),
    url: webhook.url,
    events: webhook.events,
    active: webhook.isActive,
    createdAt: webhook.createdAt.toISOString(),
    userId: webhook.userId.toString(),
    tenantId: webhook.tenantId,
  };
}

async function listWebhooks(userId, tenantId) {
  const query = {};
  if (userId) query.userId = userId;
  if (tenantId) query.tenantId = tenantId;

  const webhooks = await Webhook.find(query).sort({ createdAt: -1 });

  return webhooks.map(webhook => ({
    id: webhook._id.toString(),
    url: webhook.url,
    events: webhook.events,
    active: webhook.isActive,
    deliveryCount: webhook.deliveryCount,
    failureCount: webhook.failureCount,
    lastTriggeredAt: webhook.lastTriggeredAt?.toISOString(),
    createdAt: webhook.createdAt.toISOString(),
  }));
}

async function deleteWebhook(id) {
  const result = await Webhook.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

async function emitWebhook(event, payload) {
  const hooks = await Webhook.find({ events: event, isActive: true });
  const deliveries = [];

  for (const hook of hooks) {
    try {
      const webhookPayload = {
        event,
        payload,
        timestamp: new Date().toISOString(),
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
      };

      if (hook.secret) {
        const signature = crypto
          .createHmac('sha256', hook.secret)
          .update(JSON.stringify(webhookPayload))
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(hook.url, webhookPayload, {
        headers,
        timeout: 10000,
      });

      // Update success stats
      await Webhook.updateOne(
        { _id: hook._id },
        {
          $inc: { deliveryCount: 1 },
          $set: { lastTriggeredAt: new Date() },
          $unset: { lastError: 1 },
        }
      );

      deliveries.push({ id: hook._id.toString(), status: response.status, success: true });
    } catch (error) {
      // Update failure stats
      await Webhook.updateOne(
        { _id: hook._id },
        {
          $inc: { failureCount: 1 },
          $set: {
            lastTriggeredAt: new Date(),
            lastError: error.message,
          },
        }
      );

      deliveries.push({ id: hook._id.toString(), status: error.response?.status || 500, success: false });
    }
  }

  return deliveries;
}

module.exports = {
  registerWebhook,
  listWebhooks,
  deleteWebhook,
  emitWebhook
};

