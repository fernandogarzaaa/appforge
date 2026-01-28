import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createRecurringInvoice } from '../src/functions/utils/xenditClient.ts';

// Xendit price mapping
const planPrices = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': { name: 'Basic', amount: 20 },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': { name: 'Pro', amount: 30 },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': { name: 'Premium', amount: 99 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return Response.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    const appId = Deno.env.get('BASE44_APP_ID');
    
    if (!xenditSecretKey) {
      console.error('XENDIT_SECRET_KEY not configured');
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get plan info
    const planInfo = planPrices[priceId];
    if (!planInfo) {
      return Response.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Get origin for redirect URLs
    const origin = new URL(req.url).origin;

    try {
      // Create Xendit recurring invoice
      const invoice = await createRecurringInvoice({
        externalId: `${user.id || user.email}_${Date.now()}`,
        amount: planInfo.amount,
        description: `${planInfo.name} Plan Subscription`,
        customerEmail: user.email,
        customerName: user.name || user.email.split('@')[0],
        currency: 'USD',
        interval: 'MONTH',
        intervalCount: 1,
        successRedirectUrl: `${origin}?payment=success`,
        failureRedirectUrl: `${origin}?payment=failed`,
        metadata: {
          base44_app_id: appId || 'unknown',
          user_email: user.email,
          plan_name: planInfo.name,
          price_id: priceId
        }
      });

      // Return the invoice URL for checkout
      return Response.json({ 
        url: invoice.invoice_url,
        invoiceId: invoice.id
      }, { status: 200 });
    } catch (error) {
      console.error('Xendit invoice creation error:', error);
      return Response.json({ 
        error: error.message || 'Failed to create payment session' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});