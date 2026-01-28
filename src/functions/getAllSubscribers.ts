import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Plan mapping for Xendit invoices
const planMapping = {
  'basic': { name: 'Basic', price: 20 },
  'pro': { name: 'Pro', price: 30 },
  'premium': { name: 'Premium', price: 99 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get all invoices
    const subResponse = await fetch(
      'https://api.xendit.co/v4/invoices?limit=100',
      {
        headers: { 'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`},
      }
    );

    if (!subResponse.ok) {
      console.error('Failed to fetch invoices');
      return Response.json([], { status: 200 });
    }

    const subData = await subResponse.json();
    const subscribers = [];

    for (const invoice of subData.data) {
      // Extract plan info from description or metadata
      const description = invoice.description || '';
      const planKey = (invoice.reference_id || description).toLowerCase();
      const planInfo = planMapping[planKey] || { name: 'Custom', price: 0 };

      const customer = invoice.customer_email || invoice.customer_id || 'Unknown';
      
      subscribers.push({
        id: invoice.id,
        customer_email: customer,
        plan_name: planInfo.name,
        price: planInfo.price,
        status: invoice.status,
        created_at: new Date(invoice.created || Date.now()).toISOString(),
        expires_at: invoice.expires_at ? new Date(invoice.expires_at).toISOString() : null,
        amount: invoice.amount / 100
      });
    }

    return Response.json(subscribers, { status: 200 });
  } catch (error) {
    console.error('Get all subscribers error:', error);
    return Response.json([], { status: 200 });
  }
});