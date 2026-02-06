import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subs = await base44.asServiceRole.entities.UserSubscription.filter({
      user_id: user.email,
      status: 'active'
    });

    if (!subs.length) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.UserSubscription.update(subs[0].id, {
      status: 'canceled',
      canceled_at: new Date().toISOString()
    });

    return Response.json({ success: true, subscription: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Cancel failed' }, { status: 500 });
  }
});
