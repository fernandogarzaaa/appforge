import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active subscriptions that are about to renew (within 3 days)
    const allSubscriptions = await base44.asServiceRole.entities.UserSubscription.list('-updated_date', 1000);
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    let sentCount = 0;
    
    for (const sub of allSubscriptions) {
      if (sub.status !== 'active') continue;
      
      const renewDate = new Date(sub.renews_at);
      
      // Check if renewal is within 3 days and we haven't already sent a reminder
      if (renewDate <= threeDaysFromNow && renewDate > now) {
        // Check if reminder already sent
        const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
          subscription_id: sub.id,
          type: 'renewal_reminder',
          created_date: {
            $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          }
        });
        
        if (existingNotifs.length === 0) {
          // Get plan details
          const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
            id: sub.plan_id
          });
          const plan = plans.length > 0 ? plans[0] : null;
          
          // Send reminder
          await base44.asServiceRole.functions.invoke('sendSubscriptionNotification', {
            notification_type: 'renewal_reminder',
            subscription_id: sub.id,
            plan_name: plan?.name || 'Your Plan',
            amount: plan?.price_per_month_sol || 0,
            renewal_date: sub.renews_at
          });
          
          sentCount++;
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      reminders_sent: sentCount 
    });
  } catch (error) {
    console.error('Error scheduling renewal reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});