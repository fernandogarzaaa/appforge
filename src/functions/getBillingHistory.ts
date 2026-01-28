import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
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

    // Get customer invoices by email/id
    const customerId = user.id || user.email;
    
    const invoiceResponse = await fetch(
      `https://api.xendit.co/v4/customers/${customerId}/invoices?limit=12`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`
        }
      }
    );

    if (!invoiceResponse.ok) {
      console.error('Failed to fetch invoices');
      return Response.json([], { status: 200 });
    }

    const invoiceData = await invoiceResponse.json();
    const invoices = (invoiceData.data || []).map((invoice: any) => ({
      id: invoice.id,
      created: invoice.created,
      amount: invoice.amount,
      status: invoice.status,
      invoice_url: invoice.invoice_url,
      reference_id: invoice.reference_id
    }));

    return Response.json(invoices, { status: 200 });
  } catch (error) {
    console.error('Get billing history error:', error);
    return Response.json([], { status: 200 });
  }
});
});