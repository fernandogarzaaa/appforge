// deno-lint-ignore-file allow-importingTsExtensions
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getCustomerInvoices } from './utils/paymongoClient.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    
    if (!paymongoSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // PayMongo currently returns invoices via Billing/Subscriptions API.
    // This shim returns an empty array until that wiring is complete.
    const invoices = await getCustomerInvoices(user.id || user.email, 1, paymongoSecretKey);

    if (!invoices || invoices.length === 0) {
      return Response.json({
        subscription: null,
        status: 'no_subscription',
        message: 'User has no active subscription'
      }, { status: 200 });
    }

    const latestInvoice = invoices[0];

    // Return subscription info based on latest invoice
    return Response.json({
      subscription: {
        id: latestInvoice.id,
        status: latestInvoice.status?.toLowerCase() || 'unknown',
        amount: latestInvoice.amount,
        currency: latestInvoice.currency,
        created_at: latestInvoice.created,
        description: latestInvoice.description,
        customer_email: latestInvoice.customer?.email,
      },
      status: 'active',
      payment_provider: 'paymongo'
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
