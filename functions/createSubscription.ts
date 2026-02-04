import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, payment_method } = await req.json();

    if (!plan_id || !payment_method) {
      return Response.json({ error: 'Missing plan_id or payment_method' }, { status: 400 });
    }

    // Cancel existing active subscriptions
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({
      user_id: user.email,
      status: 'active'
    });

    for (const sub of existing) {
      await base44.asServiceRole.entities.UserSubscription.update(sub.id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });
    }

    // Get plan details
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      id: plan_id
    });

    if (plans.length === 0) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = plans[0];
    const now = new Date();
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create new subscription
    const subscription = await base44.asServiceRole.entities.UserSubscription.create({
      user_id: user.email,
      plan_id: plan_id,
      status: 'active',
      started_at: now.toISOString(),
      renews_at: renewsAt.toISOString(),
      payment_method: payment_method,
      auto_renew: true,
      current_usage: {
        api_calls_used: 0,
        recommendations_used: 0,
        workflows_used: 0,
        agents_created: 0
      },
      last_payment_date: now.toISOString(),
      next_payment_amount: payment_method === 'solana_wallet' ? plan.price_per_month_sol : plan.price_per_month_usd
    });

    return Response.json({
      success: true,
      subscription: subscription,
      plan: plan,
      message: `Successfully subscribed to ${plan.name}!`
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});