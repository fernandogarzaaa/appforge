import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subscription_id } = await req.json();
    if (!subscription_id) {
      return Response.json({ error: 'Missing subscription_id' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.UserSubscription.update(subscription_id, {
      status: 'canceled',
      canceled_at: new Date().toISOString()
    });

    return Response.json({ success: true, subscription: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Cancel failed' }, { status: 500 });
  }
});
