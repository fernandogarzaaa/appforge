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

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');

    if (!xenditSecretKey) {
      console.error('XENDIT_SECRET_KEY not configured');
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Fetch invoice from Xendit
    const sessionResponse = await fetch(
      `https://api.xendit.co/v4/invoices/${invoiceId}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`,
        },
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.json();
      console.error('Xendit error:', error);
      return Response.json({ error: 'Failed to fetch invoice details' }, { status: 500 });
    }

    const invoice = await sessionResponse.json();

    // Verify the invoice belongs to the current user
    if (invoice.customer_email !== user.email && invoice.customer_id !== user.id) {
      console.error('Invoice email mismatch:', invoice.customer_email, 'vs', user.email);
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return Response.json(invoice, { status: 200 });
  } catch (error) {
    console.error('Get checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});