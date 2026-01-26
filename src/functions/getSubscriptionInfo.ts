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
      return Response.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }

    const customerData = await customerResponse.json();
    const customer = customerData.data[0];

    if (!customer) {
      // No subscription found
      return Response.json(null, { status: 200 });
    }

    // Get active subscription for this customer
    const subResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    if (!subResponse.ok) {
      console.error('Failed to fetch subscription');
      return Response.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    const subData = await subResponse.json();
    const subscription = subData.data[0];

    if (!subscription) {
      // No active subscription
      return Response.json(null, { status: 200 });
    }

    const priceId = subscription.items.data[0].price.id;
    const planInfo = planPrices[priceId] || { name: 'Unknown', price: 0 };

    return Response.json({
      id: subscription.id,
      status: subscription.status,
      plan_name: planInfo.name,
      price: planInfo.price,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      customer_email: customer.email
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription info error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});