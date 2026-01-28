import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logger } from './utils/logger.ts';
import { createPaymentLink } from './utils/xenditClient.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planName, amount, description } = body;

    if (!planName || !amount) {
      return Response.json({ error: 'Missing required fields: planName, amount' }, { status: 400 });
    }

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    const appId = Deno.env.get('BASE44_APP_ID');
    
    if (!xenditSecretKey) {
      logger.error('XENDIT_SECRET_KEY not configured');
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get origin for redirect URLs
    const origin = new URL(req.url).origin;

    // Create Xendit invoice (payment link)
    const invoice = await createPaymentLink(
      user.id || user.email,
      Math.round(amount * 100) / 100, // Ensure proper decimal
      description || `Subscription: ${planName}`,
      user.email,
      `${origin}/billing/success?invoice_id={invoice_id}`,
      xenditSecretKey
    );

    logger.info(`Xendit invoice created: ${invoice.id}`);

    return Response.json({ 
      url: invoice.invoice_url,
      invoiceId: invoice.id,
      externalId: invoice.external_id
    }, { status: 200 });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});