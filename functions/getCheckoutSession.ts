import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return Response.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');

    if (!paymongoSecretKey) {
      console.error('PAYMONGO_SECRET_KEY not configured');
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // PayMongo checkout sessions are handled via payment links; Billing API wiring pending.
    return Response.json({
      status: 'pending',
      invoiceId,
      message: 'PayMongo checkout details will be available after Billing API is connected.'
    }, { status: 202 });
  } catch (error) {
    console.error('Get invoice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});