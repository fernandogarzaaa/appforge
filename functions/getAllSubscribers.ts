import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const planPrices = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': { name: 'Basic', price: 20 },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': { name: 'Pro', price: 30 },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': { name: 'Premium', price: 99 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get all subscriptions
    const subResponse = await fetch(
      'https://api.stripe.com/v1/subscriptions?limit=100',
      {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    if (!subResponse.ok) {
      console.error('Failed to fetch subscriptions');
      return Response.json([], { status: 200 });
    }

    const subData = await subResponse.json();
    const subscribers = [];

    for (const subscription of subData.data) {
      const priceId = subscription.items.data[0]?.price?.id;
      const planInfo = planPrices[priceId] || { name: 'Unknown', price: 0 };

      const customer = subscription.customer_email || 'Unknown';
      
      // Get invoice count
      const invoiceResponse = await fetch(
        `https://api.stripe.com/v1/invoices?subscription=${subscription.id}&limit=100`,
        {
          headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
        }
      );

      const invoiceCount = invoiceResponse.ok 
        ? (await invoiceResponse.json()).data.length
        : 0;

      subscribers.push({
        id: subscription.id,
        customer_email: customer,
        plan_name: planInfo.name,
        price: planInfo.price,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date(subscription.created * 1000).toISOString(),
        invoice_count: invoiceCount
      });
    }

    return Response.json(subscribers, { status: 200 });
  } catch (error) {
    console.error('Get all subscribers error:', error);
    return Response.json([], { status: 200 });
  }
});