import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all subscriptions expiring soon
    const expiringSubscriptions = await base44.asServiceRole.entities.UserSubscription.filter({});

    const today = new Date();
    let sent = 0;

    for (const sub of expiringSubscriptions) {
      const expiryDate = new Date(sub.current_period_end);
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry === 7 || daysUntilExpiry === 3 || daysUntilExpiry === 1) {
        // Create notification
        const notif = {
          user_id: sub.user_id,
          type: 'expiry_warning',
          title: `Subscription Expiring in ${daysUntilExpiry} days`,
          message: `Your ${sub.plan} subscription will expire on ${expiryDate.toDateString()}. Renew to continue access.`,
          subscription_id: sub.id,
          action_url: '/subscriptions',
          email_sent: false,
          sent_at: new Date().toISOString()
        };

        await base44.asServiceRole.entities.Notification.create(notif);

        // Send email
        const users = await base44.asServiceRole.entities.User.filter({ email: sub.user_id });
        if (users.length > 0) {
          await base44.integrations.Core.SendEmail({
            to: sub.user_id,
            subject: notif.title,
            body: notif.message
          }).catch(() => {});

          await base44.asServiceRole.entities.Notification.update(notif.id, { email_sent: true });
        }

        sent++;
      }
    }

    return Response.json({ success: true, sent, processed: expiringSubscriptions.length });
  } catch (error) {
    console.error('Notification send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});