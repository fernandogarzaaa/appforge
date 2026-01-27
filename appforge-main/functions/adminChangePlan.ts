import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subscription_id, new_price_id } = await req.json();

    if (!subscription_id || !new_price_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get the subscription
    const subResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription_id}`,
      {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    if (!subResponse.ok) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = await subResponse.json();
    const currentItemId = subscription.items.data[0].id;

    // Update the subscription with new price
    const updateResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'items[0][id]': currentItemId,
          'items[0][price]': new_price_id,
          'proration_behavior': 'create_prorations'
        }).toString(),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('Stripe error:', error);
      return Response.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    const updatedSub = await updateResponse.json();

    return Response.json({
      success: true,
      subscription_id: updatedSub.id
    }, { status: 200 });
  } catch (error) {
    console.error('Admin change plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});