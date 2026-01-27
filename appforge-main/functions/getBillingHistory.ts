import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get customer by email
    const customerResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}`,
      {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    if (!customerResponse.ok) {
      console.error('Failed to fetch customer');
      return Response.json([], { status: 200 });
    }

    const customerData = await customerResponse.json();
    const customer = customerData.data[0];

    if (!customer) {
      return Response.json([], { status: 200 });
    }

    // Get invoices for this customer
    const invoiceResponse = await fetch(
      `https://api.stripe.com/v1/invoices?customer=${customer.id}&limit=12`,
      {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    if (!invoiceResponse.ok) {
      console.error('Failed to fetch invoices');
      return Response.json([], { status: 200 });
    }

    const invoiceData = await invoiceResponse.json();
    const invoices = invoiceData.data.map(invoice => ({
      id: invoice.id,
      created: invoice.created,
      total: invoice.total,
      paid: invoice.paid,
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf,
      number: invoice.number
    }));

    return Response.json(invoices, { status: 200 });
  } catch (error) {
    console.error('Get billing history error:', error);
    return Response.json([], { status: 200 });
  }
});