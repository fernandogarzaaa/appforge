import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Now authenticate with Base44
    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (userId && subscriptionId) {
          // Create or update subscription record
          await base44.asServiceRole.entities.UserSubscription.create({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            started_at: new Date().toISOString(),
            renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Log audit entry
          await base44.asServiceRole.entities.CoachingAuditLog.create({
            user_id: userId,
            action_type: 'subscription_activated',
            details: {
              stripe_subscription_id: subscriptionId,
              event_type: event.type
            },
            success: true
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find and update subscription
        const subs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_customer_id: customerId
        });

        if (subs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(subs[0].id, {
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          });

          await base44.asServiceRole.entities.CoachingAuditLog.create({
            user_id: subs[0].user_id,
            action_type: 'subscription_cancelled',
            details: {
              stripe_subscription_id: subscription.id,
              event_type: event.type
            },
            success: true
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        // Update subscription renewal date
        const subs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: subscriptionId
        });

        if (subs.length > 0) {
          await base44.asServiceRole.entities.UserSubscription.update(subs[0].id, {
            renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_payment_date: new Date().toISOString()
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Log failed payment
        const subs = await base44.asServiceRole.entities.UserSubscription.filter({
          stripe_subscription_id: subscriptionId
        });

        if (subs.length > 0) {
          await base44.asServiceRole.entities.CoachingAuditLog.create({
            user_id: subs[0].user_id,
            action_type: 'payment_failed',
            details: {
              stripe_invoice_id: invoice.id,
              error: invoice.attempted
            },
            success: false
          });
        }
        break;
      }
    }

    return Response.json({ received: true, event_type: event.type });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});