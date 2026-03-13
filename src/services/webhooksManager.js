/**
 * Webhooks Management System
 * Event registration, delivery, and retry logic
 */
class WebhooksManager {
    webhooks = new Map();
    events = new Map();
    deliveryHistory = new Map();
    eventSubscribers = new Map();
    constructor() {
        this.initializeEventTypes();
    }
    /**
     * Initialize standard event types
     */
    initializeEventTypes() {
        const eventTypes = [
            'project.created',
            'project.updated',
            'project.deployed',
            'project.deleted',
            'deployment.started',
            'deployment.completed',
            'deployment.failed',
            'analysis.completed',
            'analysis.failed',
            'webhook.test'
        ];
        for (const eventType of eventTypes) {
            this.eventSubscribers.set(eventType, new Set());
        }
    }
    /**
     * Register a webhook
     */
    registerWebhook(config) {
        const webhookId = config.id || 'webhook_' + Date.now();
        const fullConfig = {
            ...config,
            id: webhookId,
            retryPolicy: config.retryPolicy || {
                maxRetries: 5,
                backoffMultiplier: 2,
                initialDelayMs: 1000
            }
        };
        this.webhooks.set(webhookId, fullConfig);
        this.events.set(webhookId, []);
        this.deliveryHistory.set(webhookId, []);
        console.log(`[Webhooks] Registered webhook: ${webhookId} for events:`, config.events);
        return webhookId;
    }
    /**
     * Update webhook configuration
     */
    updateWebhook(webhookId, updates) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook)
            return false;
        const updated = { ...webhook, ...updates, id: webhookId };
        this.webhooks.set(webhookId, updated);
        console.log(`[Webhooks] Updated webhook: ${webhookId}`);
        return true;
    }
    /**
     * Delete webhook
     */
    deleteWebhook(webhookId) {
        const deleted = this.webhooks.delete(webhookId);
        if (deleted) {
            console.log(`[Webhooks] Deleted webhook: ${webhookId}`);
        }
        return deleted;
    }
    /**
     * Emit an event to registered webhooks
     */
    async emitEvent(eventType, payload) {
        console.log(`[Webhooks] Emitting event: ${eventType}`);
        const subscribers = this.eventSubscribers.get(eventType) || new Set();
        subscribers.forEach(callback => callback(payload));
        // Queue event delivery for all subscribed webhooks
        for (const [webhookId, config] of this.webhooks.entries()) {
            if (config.active && config.events.includes(eventType)) {
                const event = {
                    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(7),
                    webhookId,
                    eventType,
                    payload,
                    timestamp: new Date(),
                    attempt: 1
                };
                await this.queueEventDelivery(event);
            }
        }
    }
    /**
     * Queue event for delivery with retry logic
     */
    async queueEventDelivery(event) {
        const webhookId = event.webhookId;
        const events = this.events.get(webhookId);
        if (events) {
            events.push(event);
        }
        // Attempt delivery
        await this.deliverEvent(event);
    }
    /**
     * Deliver webhook event with retry logic
     */
    async deliverEvent(event) {
        const webhook = this.webhooks.get(event.webhookId);
        if (!webhook)
            return;
        const startTime = Date.now();
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'AppForge-Webhook/1.0',
                'X-Webhook-ID': event.webhookId,
                'X-Event-ID': event.id,
                'X-Event-Type': event.eventType,
                'X-Delivery-Attempt': event.attempt.toString(),
                ...webhook.headers
            };
            // Add signature for security
            if (webhook.secret) {
                const crypto = require('crypto');
                const signature = crypto
                    .createHmac('sha256', webhook.secret)
                    .update(JSON.stringify(event.payload))
                    .digest('hex');
                headers['X-Webhook-Signature'] = `sha256=${signature}`;
            }
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: event.id,
                    eventType: event.eventType,
                    data: event.payload,
                    timestamp: event.timestamp
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            const responseTime = Date.now() - startTime;
            if (response.ok) {
                this.recordDelivery(event.webhookId, {
                    success: true,
                    statusCode: response.status,
                    responseTime,
                    message: 'Delivered successfully',
                    timestamp: new Date()
                });
                console.log(`[Webhooks] Event delivered: ${event.id} to ${webhook.url} (${responseTime}ms)`);
            }
            else {
                throw new Error(`HTTP ${response.status}`);
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.recordDelivery(event.webhookId, {
                success: false,
                responseTime,
                message: errorMessage,
                timestamp: new Date()
            });
            // Retry logic
            if (event.attempt < webhook.retryPolicy.maxRetries) {
                const delay = webhook.retryPolicy.initialDelayMs *
                    Math.pow(webhook.retryPolicy.backoffMultiplier, event.attempt - 1);
                event.attempt++;
                event.nextRetryAt = new Date(Date.now() + delay);
                event.lastError = errorMessage;
                console.log(`[Webhooks] Retrying event ${event.id} in ${delay}ms (attempt ${event.attempt})`);
                // Schedule retry
                setTimeout(() => this.deliverEvent(event), delay);
            }
            else {
                console.error(`[Webhooks] Event delivery failed after ${event.attempt} attempts:`, {
                    eventId: event.id,
                    webhookUrl: webhook.url,
                    error: errorMessage
                });
            }
        }
    }
    /**
     * Record delivery attempt
     */
    recordDelivery(webhookId, result) {
        const history = this.deliveryHistory.get(webhookId);
        if (history) {
            history.push(result);
            // Keep only last 1000 deliveries
            if (history.length > 1000) {
                history.shift();
            }
        }
    }
    /**
     * Get webhook statistics
     */
    getWebhookStats(webhookId) {
        const history = this.deliveryHistory.get(webhookId) || [];
        const successful = history.filter(h => h.success).length;
        const avgResponseTime = history.length > 0
            ? history.reduce((sum, h) => sum + h.responseTime, 0) / history.length
            : 0;
        return {
            webhookId,
            totalDeliveries: history.length,
            successfulDeliveries: successful,
            failedDeliveries: history.length - successful,
            successRate: history.length > 0 ? (successful / history.length) * 100 : 0,
            averageResponseTime: Math.round(avgResponseTime)
        };
    }
    /**
     * Get recent deliveries
     */
    getRecentDeliveries(webhookId, limit = 10) {
        const history = this.deliveryHistory.get(webhookId) || [];
        return history.slice(-limit).reverse();
    }
    /**
     * Subscribe to event type
     */
    subscribe(eventType, callback) {
        if (!this.eventSubscribers.has(eventType)) {
            this.eventSubscribers.set(eventType, new Set());
        }
        this.eventSubscribers.get(eventType).add(callback);
    }
    /**
     * Unsubscribe from event type
     */
    unsubscribe(eventType, callback) {
        const subscribers = this.eventSubscribers.get(eventType);
        if (subscribers) {
            subscribers.delete(callback);
        }
    }
    /**
     * Test webhook delivery
     */
    async testWebhook(webhookId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) {
            return {
                success: false,
                responseTime: 0,
                message: 'Webhook not found',
                timestamp: new Date()
            };
        }
        const testEvent = {
            id: 'test_evt_' + Date.now(),
            webhookId,
            eventType: 'webhook.test',
            payload: { test: true, timestamp: new Date() },
            timestamp: new Date(),
            attempt: 1
        };
        return new Promise(resolve => {
            this.deliverEvent(testEvent).then(() => {
                const history = this.deliveryHistory.get(webhookId);
                if (history && history.length > 0) {
                    resolve(history[history.length - 1]);
                }
                else {
                    resolve({
                        success: false,
                        responseTime: 0,
                        message: 'Test delivery failed',
                        timestamp: new Date()
                    });
                }
            });
        });
    }
    /**
     * Get all webhooks for user
     */
    getUserWebhooks(userId) {
        return Array.from(this.webhooks.values()).filter(w => w.userId === userId);
    }
    /**
     * Get webhook configuration
     */
    getWebhook(webhookId) {
        return this.webhooks.get(webhookId);
    }
}
// Export singleton instance
export const webhooksManager = new WebhooksManager();
export default WebhooksManager;
