import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Processes and dispatches webhook events to registered endpoints
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_type, resource_type, resource_id, data } = await req.json();

    if (!event_type || !resource_type) {
      return Response.json({ error: 'Missing event_type or resource_type' }, { status: 400 });
    }

    // Get all active webhooks
    const webhooks = await base44.asServiceRole.entities.Webhook.filter({
      is_active: true
    });

    // Filter webhooks that are subscribed to this event
    const relevantWebhooks = webhooks.filter(w =>
      w.events.includes(event_type) || w.events.includes(`${resource_type}.*`)
    );

    if (relevantWebhooks.length === 0) {
      return Response.json({ success: true, dispatched: 0 });
    }

    // Dispatch to all relevant webhooks
    const results = await Promise.allSettled(
      relevantWebhooks.map(webhook =>
        dispatchWebhook(webhook, {
          event_type,
          resource_type,
          resource_id,
          data,
          timestamp: new Date().toISOString()
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Log webhook activity
    if (failed > 0) {
      await base44.asServiceRole.entities.CoachingAuditLog.create({
        user_id: 'system',
        action_type: 'webhook_dispatch',
        details: {
          event_type,
          dispatched: successful,
          failed
        },
        success: failed === 0
      });
    }

    return Response.json({
      success: true,
      dispatched: successful,
      failed
    });
  } catch (error) {
    console.error('Webhook processor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function dispatchWebhook(webhook, payload) {
  const signature = await generateWebhookSignature(payload, webhook.secret);

  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': payload.event_type
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.status}`);
  }

  return response.json();
}

async function generateWebhookSignature(payload, secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}