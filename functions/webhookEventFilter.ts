import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Filter webhook events at source to reduce noise
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { webhook_id, event } = await req.json();

    if (!webhook_id || !event) {
      return Response.json(
        { error: 'Missing webhook_id or event' },
        { status: 400 }
      );
    }

    // Get webhook
    const webhooks = await base44.asServiceRole.entities.Webhook.filter({
      id: webhook_id
    });

    if (webhooks.length === 0) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhook = webhooks[0];

    // Check if event type is subscribed
    if (!webhook.events.includes(event.type)) {
      return Response.json({
        should_deliver: false,
        reason: 'Event type not subscribed'
      });
    }

    // Apply event filters if configured
    if (webhook.event_filters && Object.keys(webhook.event_filters).length > 0) {
      const matches = applyFilters(event, webhook.event_filters);
      if (!matches) {
        return Response.json({
          should_deliver: false,
          reason: 'Event does not match filters'
        });
      }
    }

    return Response.json({
      should_deliver: true,
      webhook_id,
      event_type: event.type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Event filtering error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function applyFilters(event, filters) {
  // Apply each filter condition
  for (const [key, filterValue] of Object.entries(filters)) {
    const eventValue = getNestedValue(event, key);

    if (Array.isArray(filterValue)) {
      // Match if value is in array
      if (!filterValue.includes(eventValue)) {
        return false;
      }
    } else if (typeof filterValue === 'object' && filterValue !== null) {
      // Advanced filter operations
      if (filterValue.equals !== undefined && eventValue !== filterValue.equals) {
        return false;
      }
      if (filterValue.contains !== undefined && !String(eventValue).includes(filterValue.contains)) {
        return false;
      }
      if (filterValue.regex !== undefined && !new RegExp(filterValue.regex).test(eventValue)) {
        return false;
      }
      if (filterValue.gt !== undefined && eventValue <= filterValue.gt) {
        return false;
      }
      if (filterValue.lt !== undefined && eventValue >= filterValue.lt) {
        return false;
      }
    } else {
      // Simple equality match
      if (eventValue !== filterValue) {
        return false;
      }
    }
  }

  return true;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current?.[prop];
  }, obj);
}