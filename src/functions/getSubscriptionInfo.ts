// deno-lint-ignore-file allow-importingTsExtensions
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getCustomerInvoices } from './utils/xenditClient.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    
    if (!xenditSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get customer's invoices from Xendit
    const invoices = await getCustomerInvoices(user.id || user.email, 1, xenditSecretKey);

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
      payment_provider: 'xendit'
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
