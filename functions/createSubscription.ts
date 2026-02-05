import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, payment_method, stripe_subscription_id } = await req.json();

    if (!plan_id) {
      return Response.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Get the plan details
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ id: plan_id });
    if (plans.length === 0) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = plans[0];

    // Cancel any existing active subscriptions
    const existingSubs = await base44.entities.UserSubscription.filter({
      user_id: user.email,
      status: 'active'
    });

    for (const sub of existingSubs) {
      await base44.entities.UserSubscription.update(sub.id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });
    }

    // Create new subscription
    const subscription = await base44.entities.UserSubscription.create({
      user_id: user.email,
      plan_id: plan_id,
      status: 'active',
      payment_method: payment_method || 'stripe',
      stripe_subscription_id: stripe_subscription_id,
      current_usage: {
        agents_created: 0,
        recommendations_used: 0,
        workflows_used: 0,
        api_calls_used: 0
      },
      started_at: new Date().toISOString(),
      renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Log audit entry
    await base44.asServiceRole.entities.CoachingAuditLog.create({
      user_id: user.email,
      action_type: 'subscription_created',
      details: {
        plan_id: plan_id,
        plan_name: plan.name,
        payment_method
      },
      success: true
    });

    // Send confirmation email if needed
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Welcome to ${plan.name}`,
        body: `You have successfully subscribed to the ${plan.name} plan.\n\nYour subscription is active and renews on ${new Date(subscription.renews_at).toLocaleDateString()}.`
      });
    } catch (e) {
      console.log('Email notification failed, continuing...');
    }

    return Response.json({
      success: true,
      subscription,
      message: `Successfully subscribed to ${plan.name}`
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});