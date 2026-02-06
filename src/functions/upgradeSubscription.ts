import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, payment_method, transaction_signature } = await req.json();
    if (!plan_id) {
      return Response.json({ error: 'Missing plan_id' }, { status: 400 });
    }

    const plans = await base44.asServiceRole.entities.Subscription.filter({ id: plan_id });
    const plan = plans[0];
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (transaction_signature) {
      const tx = await base44.asServiceRole.entities.SolanaTransaction.filter({
        transaction_signature
      });
      if (!tx.length) {
        return Response.json({ error: 'Payment not verified' }, { status: 400 });
      }
    }

    const active = await base44.asServiceRole.entities.UserSubscription.filter({
      user_id: user.email,
      status: 'active'
    });

    const now = new Date();
    const renewsAt = addMonths(now, 1);

    if (!active.length) {
      const created = await base44.asServiceRole.entities.UserSubscription.create({
        user_id: user.email,
        subscription_id: plan.id,
        plan_id: plan.id,
        plan_name: plan.tier_name || plan.name || plan.id,
        status: 'active',
        started_at: now.toISOString(),
        renews_at: renewsAt.toISOString(),
        price: plan.price_sol || plan.price_per_month_sol || plan.price || 0,
        payment_method: payment_method || 'solana',
        payment_tx: transaction_signature || null
      });
      return Response.json({ success: true, subscription: created });
    }

    const updated = await base44.asServiceRole.entities.UserSubscription.update(active[0].id, {
      subscription_id: plan.id,
      plan_id: plan.id,
      plan_name: plan.tier_name || plan.name || plan.id,
      renews_at: renewsAt.toISOString(),
      price: plan.price_sol || plan.price_per_month_sol || plan.price || 0,
      payment_method: payment_method || 'solana',
      payment_tx: transaction_signature || null
    });

    return Response.json({ success: true, subscription: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Upgrade failed' }, { status: 500 });
  }
});
