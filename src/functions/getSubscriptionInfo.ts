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
      return Response.json(null, { status: 200 });
    }

    const subscription = subs[0];
    const plans = await base44.asServiceRole.entities.Subscription.filter({
      id: subscription.subscription_id || subscription.plan_id
    });
    const plan = plans[0];

    return Response.json({
      id: subscription.id,
      plan_id: subscription.subscription_id || subscription.plan_id,
      plan_name: subscription.plan_name || plan?.tier_name || plan?.name || 'Unknown',
      status: subscription.status,
      price: subscription.price || plan?.price_sol || plan?.price_per_month_sol || plan?.price || 0,
      next_billing_date: subscription.renews_at,
      started_at: subscription.started_at,
      payment_method: subscription.payment_method || 'solana',
      payment_tx: subscription.payment_tx || null
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load subscription' }, { status: 500 });
  }
});
