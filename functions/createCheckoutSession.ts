import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return Response.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Create Stripe checkout session
    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': `${new URL(req.url).origin}?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${new URL(req.url).origin}`,
        'customer_email': user.email,
        'metadata[base44_app_id]': Deno.env.get('BASE44_APP_ID'),
        'metadata[user_email]': user.email,
      }).toString(),
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.json();
      console.error('Stripe error:', error);
      return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    const session = await checkoutResponse.json();

    return Response.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});