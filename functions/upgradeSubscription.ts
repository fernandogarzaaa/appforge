import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_id } = await req.json();

    if (!subscription_id) {
      return Response.json({ error: 'Missing subscription_id' }, { status: 400 });
    }

    // Get subscription details
    const subscription = await base44.asServiceRole.entities.Subscription.filter({
      id: subscription_id
    });

    if (!subscription || subscription.length === 0) {
      return Response.json({ error: 'Subscription tier not found' }, { status: 404 });
    }

    const tier = subscription[0];

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

    // Create new subscription (pending until payment confirmed)
    const userSubscription = await base44.asServiceRole.entities.UserSubscription.create({
      user_id: user.email,
      subscription_id: subscription_id,
      tier_name: tier.tier_name,
      status: 'pending'
    });

    return Response.json({
      success: true,
      subscription: userSubscription,
      amount_sol: tier.price_sol,
      message: `Subscribe to ${tier.tier_name}`
    });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});