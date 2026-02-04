import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!event || !event.type) {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const subscription = data;
    
    // Get plan details
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      id: subscription.plan_id
    });
    const plan = plans.length > 0 ? plans[0] : null;

    // Determine notification type based on event
    let notificationType;
    
    if (event.type === 'create') {
      notificationType = 'payment_confirmation';
    } else if (event.type === 'update') {
      // Check if it's an upgrade or downgrade
      if (old_data && old_data.plan_id !== subscription.plan_id) {
        // Fetch old plan tier
        const oldPlans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
          id: old_data.plan_id
        });
        const oldPlan = oldPlans.length > 0 ? oldPlans[0] : null;
        
        const tierOrder = { free: 0, basic: 1, premium: 2, enterprise: 3 };
        const oldTierValue = tierOrder[oldPlan?.tier] || 0;
        const newTierValue = tierOrder[plan?.tier] || 0;
        
        notificationType = newTierValue > oldTierValue ? 'plan_upgrade' : 'plan_downgrade';
      }
    }

    if (!notificationType) {
      return Response.json({ success: true, skipped: true });
    }

    // Send notification
    const response = await base44.asServiceRole.functions.invoke('sendSubscriptionNotification', {
      notification_type: notificationType,
      subscription_id: subscription.id,
      plan_name: plan?.name || 'Your Plan',
      amount: plan?.price_per_month_sol || 0,
      renewal_date: subscription.renews_at
    });

    return Response.json({ success: true, response: response.data });
  } catch (error) {
    console.error('Error handling subscription event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});