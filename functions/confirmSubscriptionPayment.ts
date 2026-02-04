import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, subscription_id, transaction_signature } = await req.json();

    if (!user_email || !subscription_id || !transaction_signature) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get subscription tier
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      id: subscription_id
    });

    if (!subs || subs.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const tier = subs[0];

    // Get or create user subscription
    const userSubs = await base44.asServiceRole.entities.UserSubscription.filter({
      user_id: user_email,
      subscription_id: subscription_id
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (userSubs.length > 0) {
      // Update existing
      await base44.asServiceRole.entities.UserSubscription.update(
        userSubs[0].id,
        {
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          transaction_signature: transaction_signature
        }
      );
    } else {
      // Create new
      await base44.asServiceRole.entities.UserSubscription.create({
        user_id: user_email,
        subscription_id: subscription_id,
        tier_name: tier.tier_name,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        transaction_signature: transaction_signature
      });
    }

    return Response.json({
      success: true,
      message: `Successfully subscribed to ${tier.tier_name}`
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});