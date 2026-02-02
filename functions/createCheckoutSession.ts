import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createPaymentLink } from '../src/functions/utils/paymongoClient.ts';

// PayMongo price mapping
const planPrices = {
  paymongo_basic_plan: { name: 'Basic', amount: 20 },
  paymongo_pro_plan: { name: 'Pro', amount: 30 },
  paymongo_premium_plan: { name: 'Premium', amount: 99 }
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

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    const appId = Deno.env.get('BASE44_APP_ID');
    
    if (!paymongoSecretKey) {
      console.error('PAYMONGO_SECRET_KEY not configured');
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
      // Create PayMongo payment link
      const invoice = await createPaymentLink(
        user.id || user.email,
        planInfo.amount,
        `${planInfo.name} Plan Subscription`,
        user.email,
        `${origin}?payment=success`,
        paymongoSecretKey,
        'USD'
      );

      return Response.json({
        url: invoice.invoice_url,
        invoiceId: invoice.id,
        externalId: invoice.external_id,
        metadata: {
          base44_app_id: appId || 'unknown',
          user_email: user.email,
          plan_name: planInfo.name,
          price_id: priceId
        }
      }, { status: 200 });
    } catch (error) {
      console.error('PayMongo invoice creation error:', error);
      return Response.json({ 
        error: error.message || 'Failed to create payment session' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});