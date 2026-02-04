import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      notification_type, 
      subscription_id, 
      plan_name, 
      amount,
      renewal_date 
    } = await req.json();

    // Fetch subscription details
    const subscription = await base44.asServiceRole.entities.UserSubscription.get(subscription_id);
    if (!subscription) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Build notification content
    let notificationData = {
      user_id: user.email,
      subscription_id,
      email_sent: false
    };

    switch (notification_type) {
      case 'renewal_reminder':
        notificationData = {
          ...notificationData,
          type: 'renewal_reminder',
          title: 'Subscription Renewal Coming',
          message: `Your ${plan_name} subscription will renew on ${new Date(renewal_date).toLocaleDateString()} for ${amount} SOL`,
          action_url: '/subscriptions'
        };
        break;

      case 'payment_confirmation':
        notificationData = {
          ...notificationData,
          type: 'payment_confirmation',
          title: 'Payment Confirmed',
          message: `Your payment of ${amount} SOL for ${plan_name} has been successfully processed`,
          action_url: '/subscriptions'
        };
        break;

      case 'expiry_warning':
        notificationData = {
          ...notificationData,
          type: 'expiry_warning',
          title: 'Subscription Expiring Soon',
          message: `Your ${plan_name} subscription expires on ${new Date(renewal_date).toLocaleDateString()}. Renew now to avoid interruption.`,
          action_url: '/subscriptions'
        };
        break;

      case 'plan_upgrade':
        notificationData = {
          ...notificationData,
          type: 'plan_upgrade',
          title: 'Plan Upgraded',
          message: `You've successfully upgraded to ${plan_name}! Enjoy the new features.`,
          action_url: '/subscriptions'
        };
        break;

      case 'plan_downgrade':
        notificationData = {
          ...notificationData,
          type: 'plan_downgrade',
          title: 'Plan Downgraded',
          message: `Your subscription has been downgraded to ${plan_name}`,
          action_url: '/subscriptions'
        };
        break;

      case 'failed_payment':
        notificationData = {
          ...notificationData,
          type: 'failed_payment',
          title: 'Payment Failed',
          message: `Your recent payment for ${plan_name} failed. Please update your payment method.`,
          action_url: '/subscriptions'
        };
        break;
    }

    // Create in-app notification
    const notification = await base44.asServiceRole.entities.Notification.create(notificationData);

    // Send email notification
    const emailResponse = await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: notificationData.title,
      body: notificationData.message
    });

    // Mark email as sent
    await base44.asServiceRole.entities.Notification.update(notification.id, {
      email_sent: true,
      sent_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      notification_id: notification.id 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});