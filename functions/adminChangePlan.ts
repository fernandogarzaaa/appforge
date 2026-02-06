import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subscription_id, plan_id } = await req.json();
    if (!subscription_id || !plan_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plan = await base44.asServiceRole.entities.Subscription.filter({ id: plan_id });
    if (!plan.length) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.UserSubscription.update(subscription_id, {
      subscription_id: plan_id,
      plan_id,
      plan_name: plan[0].tier_name || plan[0].name || plan_id,
      price: plan[0].price_sol || plan[0].price_per_month_sol || plan[0].price || 0,
      updated_at: new Date().toISOString()
    });

    return Response.json({ success: true, subscription: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Change plan failed' }, { status: 500 });
  }
});
