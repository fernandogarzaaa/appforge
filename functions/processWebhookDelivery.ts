import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

/**
 * Process webhook delivery - called when an event occurs
 * Handles filtering, signature creation, and delivery scheduling
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_type, payload, webhook_id } = await req.json();

    if (!event_type || !payload) {
      return Response.json(
        { error: 'Missing event_type or payload' },
        { status: 400 }
      );
    }

    // Get webhooks for this event
    let webhooks = [];
    if (webhook_id) {
      webhooks = await base44.asServiceRole.entities.Webhook.filter({
        id: webhook_id,
        is_active: true
      });
    } else {
      webhooks = await base44.asServiceRole.entities.Webhook.filter({
        is_active: true
      });
      webhooks = webhooks.filter(w => w.events.includes(event_type));
    }

    const results = [];

    for (const webhook of webhooks) {
      // Apply event filters
      if (webhook.event_filters && Object.keys(webhook.event_filters).length > 0) {
        const matches = applyFilters(payload, webhook.event_filters);
        if (!matches) continue;
      }

      // Generate signature
      const signature = generateSignature(webhook.secret, JSON.stringify(payload));

      // Create delivery record
      const delivery = await base44.asServiceRole.entities.WebhookDelivery.create({
        webhook_id: webhook.id,
        event_type,
        payload,
        status: 'pending',
        attempt_count: 1
      });

      // Schedule delivery
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-ID': webhook.id,
            'X-Event-Type': event_type,
            'X-Timestamp': new Date().toISOString()
          },
          body: JSON.stringify(payload)
        });

        // Update delivery with response
        await base44.asServiceRole.entities.WebhookDelivery.update(delivery.id, {
          status: response.ok ? 'success' : 'failed',
          response_code: response.status,
          response_body: await response.text(),
          delivered_at: new Date().toISOString()
        });

        // Update webhook stats
        if (response.ok) {
          await base44.asServiceRole.entities.Webhook.update(webhook.id, {
            success_count: (webhook.success_count || 0) + 1,
            last_triggered: new Date().toISOString()
          });
        } else {
          await base44.asServiceRole.entities.Webhook.update(webhook.id, {
            failure_count: (webhook.failure_count || 0) + 1
          });
        }

        results.push({
          webhook_id: webhook.id,
          delivery_id: delivery.id,
          status: response.ok ? 'success' : 'failed'
        });
      } catch (error) {
        // Schedule retry
        await base44.asServiceRole.entities.WebhookDelivery.update(delivery.id, {
          status: 'retrying',
          error_message: error.message,
          next_retry: new Date(Date.now() + 1000).toISOString()
        });

        results.push({
          webhook_id: webhook.id,
          delivery_id: delivery.id,
          status: 'error',
          message: error.message
        });
      }
    }

    return Response.json({
      success: true,
      event_type,
      deliveries_created: results.length,
      results
    });
  } catch (error) {
    console.error('Webhook delivery error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSignature(secret, payload) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

function applyFilters(payload, filters) {
  for (const [key, filterValue] of Object.entries(filters)) {
    const value = getNestedValue(payload, key);

    if (Array.isArray(filterValue)) {
      if (!filterValue.includes(value)) return false;
    } else if (typeof filterValue === 'object' && filterValue !== null) {
      if (filterValue.equals !== undefined && value !== filterValue.equals) return false;
      if (filterValue.contains !== undefined && !String(value).includes(filterValue.contains)) return false;
      if (filterValue.regex !== undefined && !new RegExp(filterValue.regex).test(value)) return false;
      if (filterValue.gt !== undefined && value <= filterValue.gt) return false;
      if (filterValue.lt !== undefined && value >= filterValue.lt) return false;
    } else {
      if (value !== filterValue) return false;
    }
  }
  return true;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}