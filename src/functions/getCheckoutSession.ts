import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Fetch session from Stripe with line items and subscription details
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items&expand[]=subscription`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.json();
      console.error('Stripe error:', error);
      return Response.json({ error: 'Failed to fetch session details' }, { status: 500 });
    }

    const session = await sessionResponse.json();

    // Verify the session belongs to the current user
    if (session.customer_email !== user.email) {
      console.error('Session email mismatch:', session.customer_email, 'vs', user.email);
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return Response.json(session, { status: 200 });
  } catch (error) {
    console.error('Get checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});