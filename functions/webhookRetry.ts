import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Handle webhook retries with exponential backoff
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { webhook_delivery_id } = await req.json();

    if (!webhook_delivery_id) {
      return Response.json({ error: 'Missing webhook_delivery_id' }, { status: 400 });
    }

    // Get delivery record
    const deliveries = await base44.asServiceRole.entities.WebhookDelivery.filter({
      id: webhook_delivery_id
    });

    if (deliveries.length === 0) {
      return Response.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const delivery = deliveries[0];

    // Get webhook
    const webhooks = await base44.asServiceRole.entities.Webhook.filter({
      id: delivery.webhook_id
    });

    if (webhooks.length === 0) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhook = webhooks[0];
    const retryPolicy = webhook.retry_policy || {
      max_retries: 5,
      initial_delay_ms: 1000,
      max_delay_ms: 60000
    };

    // Check if should retry
    if (delivery.attempt_count >= retryPolicy.max_retries) {
      return Response.json({
        success: false,
        message: 'Max retries exceeded'
      });
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      retryPolicy.initial_delay_ms * Math.pow(2, delivery.attempt_count - 1),
      retryPolicy.max_delay_ms
    );

    // Schedule retry
    const nextRetry = new Date(Date.now() + delay);

    await base44.asServiceRole.entities.WebhookDelivery.update(webhook_delivery_id, {
      status: 'retrying',
      attempt_count: delivery.attempt_count + 1,
      next_retry: nextRetry.toISOString()
    });

    return Response.json({
      success: true,
      next_retry: nextRetry.toISOString(),
      delay_ms: delay,
      attempt: delivery.attempt_count + 1
    });
  } catch (error) {
    console.error('Webhook retry error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});