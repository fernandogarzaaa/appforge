import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

const planPrices = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': { name: 'Basic', price: 20 },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': { name: 'Pro', price: 30 },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': { name: 'Premium', price: 99 }
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature (MUST use async method for Deno)
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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (customerEmail) {
          // Send welcome email
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Welcome! Your Subscription is Active',
              body: `Thank you for subscribing! Your payment was successful and your account is now active. You can manage your subscription anytime from your account settings.`,
              from_name: 'Subscription Team'
            });
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const previousAttributes = event.data.previous_attributes;
        
        // Check if plan changed
        if (previousAttributes?.items) {
          const oldPriceId = previousAttributes.items?.data?.[0]?.price?.id;
          const newPriceId = subscription.items.data[0]?.price?.id;
          
          if (oldPriceId && newPriceId && oldPriceId !== newPriceId) {
            const oldPlan = planPrices[oldPriceId]?.name || 'Unknown';
            const newPlan = planPrices[newPriceId]?.name || 'Unknown';
            
            // Send plan change notification
            const customerEmail = subscription.customer_email;
            if (customerEmail) {
              try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                  to: customerEmail,
                  subject: 'Your Plan Has Been Updated',
                  body: `Your subscription plan has been changed from ${oldPlan} to ${newPlan}. The changes will take effect immediately. You can view your updated billing in your account settings.`,
                  from_name: 'Subscription Team'
                });
              } catch (emailError) {
                console.error('Failed to send plan change email:', emailError);
              }
            }
          }
        }

        // Check if subscription was canceled
        if (subscription.cancel_at_period_end && !previousAttributes?.cancel_at_period_end) {
          // Subscription set to cancel at period end
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const customerEmail = subscription.customer_email;
        
        if (customerEmail) {
          // Send subscription ended notification
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Your Subscription Has Ended',
              body: `Your subscription has ended. We're sorry to see you go! If you'd like to resubscribe or have any questions, please visit your account or contact our support team.`,
              from_name: 'Subscription Team'
            });
          } catch (emailError) {
            console.error('Failed to send subscription ended email:', emailError);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        // Could track successful payments here
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        const customerEmail = invoice.customer_email;
        
        if (customerEmail) {
          // Send payment failure notification
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Payment Failed - Action Required',
              body: `We were unable to process your recent payment. Please update your payment method in your account settings to avoid service interruption.`,
              from_name: 'Billing Team'
            });
          } catch (emailError) {
            console.error('Failed to send payment failed email:', emailError);
          }
        }
        break;
      }

      default:
        // Unhandled webhook event type - could be logged for monitoring
        break;
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});