import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, transaction_signature } = await req.json();

    if (!plan_id || !transaction_signature) {
      return Response.json({ error: 'Missing plan_id or transaction_signature' }, { status: 400 });
    }

    // Get plan details
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      id: plan_id
    });

    if (!plans || plans.length === 0) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = plans[0];

    // Check if user already has active subscription
    const existing = await base44.asServiceRole.entities.UserSubscription.filter({
      user_id: user.email,
      status: 'active'
    });

    if (existing.length > 0) {
      // Cancel previous subscription
      await base44.asServiceRole.entities.UserSubscription.update(
        existing[0].id,
        { status: 'cancelled' }
      );
    }

    // Create new active subscription
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1);

    const userSubscription = await base44.asServiceRole.entities.UserSubscription.create({
      user_id: user.email,
      plan_id: plan_id,
      status: 'active',
      started_at: new Date().toISOString(),
      renews_at: renewDate.toISOString(),
      auto_renew: true,
      payment_method: 'solana_wallet',
      current_usage: {
        api_calls_used: 0,
        recommendations_used: 0,
        workflows_used: 0,
        agents_created: 0
      },
      last_payment_date: new Date().toISOString(),
      next_payment_amount: plan.price_per_month_sol
    });

    // Store transaction
    await base44.asServiceRole.entities.SolanaTransaction.create({
      user_id: user.email,
      amount_sol: plan.price_per_month_sol,
      transaction_signature: transaction_signature,
      payment_type: 'subscription_upgrade',
      reference_id: userSubscription.id,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      subscription: userSubscription,
      message: `Upgraded to ${plan.name} plan`
    });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});