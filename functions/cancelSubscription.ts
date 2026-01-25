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
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerData = await customerResponse.json();
    const customer = customerData.data[0];

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get active subscription
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
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel the subscription
    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json();
      console.error('Stripe error:', error);
      return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    const canceledSub = await cancelResponse.json();

    // Send cancellation confirmation email
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Subscription Canceled',
        body: `Your subscription has been canceled. You will retain access until the end of your current billing period. If you have any questions, please contact support.`,
        from_name: 'Billing Team'
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    return Response.json({
      success: true,
      subscription_id: canceledSub.id,
      status: canceledSub.status
    }, { status: 200 });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});