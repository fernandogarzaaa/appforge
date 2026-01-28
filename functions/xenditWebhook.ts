import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { verifyWebhookSignature } from '../src/functions/utils/xenditClient.ts';

const planPrices = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': { name: 'Basic', price: 20 },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': { name: 'Pro', price: 30 },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': { name: 'Premium', price: 99 }
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const webhookToken = Deno.env.get('XENDIT_WEBHOOK_TOKEN');
    
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-callback-token') || '';

    // Verify webhook signature if token is configured
    if (webhookToken) {
      try {
        const isValid = verifyWebhookSignature(body, signature, webhookToken);
        if (!isValid) {
          console.error('Webhook signature verification failed');
          return Response.json({ error: 'Invalid signature' }, { status: 401 });
        }
      } catch (err) {
        console.error('Webhook verification error:', err.message);
        return Response.json({ error: 'Signature verification failed' }, { status: 400 });
      }
    } else {
      console.warn('XENDIT_WEBHOOK_TOKEN not configured - skipping signature verification');
    }

    const event = JSON.parse(body);
    const eventType = event.event || event.status;

    console.log('Received Xendit webhook event:', eventType);

    // Handle different Xendit event types
    switch (eventType) {
      case 'invoice.paid': 
      case 'payment.paid': {
        const invoice = event.data || event;
        console.log('Payment successful:', invoice.id);
        
        const customerEmail = invoice.customer_email || invoice.payer_email;
        
        if (customerEmail) {
          // Send payment success email
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Payment Successful - Subscription Active',
              body: `Thank you for your payment! Your subscription is now active. You can manage your subscription anytime from your account settings.`,
              from_name: 'Subscription Team'
            });
            console.log('Payment success email sent to:', customerEmail);
          } catch (emailError) {
            console.error('Failed to send payment success email:', emailError);
          }
        }
        break;
      }

      case 'invoice.created': {
        const invoice = event.data || event;
        console.log('Invoice created:', invoice.id);
        
        // Track invoice creation - could update database here
        break;
      }

      case 'invoice.expired':
      case 'invoice.failed': {
        const invoice = event.data || event;
        console.log('Invoice expired/failed:', invoice.id);
        
        const customerEmail = invoice.customer_email || invoice.payer_email;
        
        if (customerEmail) {
          // Send payment failure notification
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Payment Failed - Action Required',
              body: `We were unable to process your recent payment. Please check your payment method or contact support to avoid service interruption.`,
              from_name: 'Billing Team'
            });
            console.log('Payment failed email sent to:', customerEmail);
          } catch (emailError) {
            console.error('Failed to send payment failed email:', emailError);
          }
        }
        break;
      }

      case 'recurring_charge.created': {
        const charge = event.data || event;
        console.log('Recurring charge created:', charge.id);
        
        // Track recurring charge creation
        break;
      }

      case 'recurring_charge.cancelled': {
        const charge = event.data || event;
        console.log('Recurring charge cancelled:', charge.id);
        
        const customerEmail = charge.customer_email;
        
        if (customerEmail) {
          // Send subscription cancellation notification
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Your Subscription Has Been Cancelled',
              body: `Your subscription has been cancelled. You will continue to have access until the end of your current billing period. We're sorry to see you go!`,
              from_name: 'Subscription Team'
            });
            console.log('Cancellation email sent to:', customerEmail);
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
          }
        }
        break;
      }

      case 'recurring_charge.updated': {
        const charge = event.data || event;
        console.log('Recurring charge updated:', charge.id);
        
        // Could track plan changes here
        const customerEmail = charge.customer_email;
        
        if (customerEmail) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Your Subscription Has Been Updated',
              body: `Your subscription details have been updated. You can view the changes in your account settings.`,
              from_name: 'Subscription Team'
            });
            console.log('Subscription update email sent to:', customerEmail);
          } catch (emailError) {
            console.error('Failed to send update email:', emailError);
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.data || event;
        console.log('Payment failed:', payment.id);
        
        const customerEmail = payment.customer_email || payment.payer_email;
        
        if (customerEmail) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: customerEmail,
              subject: 'Payment Failed - Please Update Payment Method',
              body: `Your recent payment attempt failed. Please update your payment information to continue your subscription.`,
              from_name: 'Billing Team'
            });
            console.log('Payment failure email sent to:', customerEmail);
          } catch (emailError) {
            console.error('Failed to send payment failure email:', emailError);
          }
        }
        break;
      }

      default:
        console.log('Unhandled Xendit webhook event:', eventType);
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});