import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subscription_id } = await req.json();

    if (!subscription_id) {
      return Response.json({ error: 'Missing subscription_id' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get the subscription to find customer email
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
    const customerEmail = subscription.customer_email;

    // Cancel the subscription
    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription_id}`,
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

    // Send cancellation email
    try {
      await base44.integrations.Core.SendEmail({
        to: customerEmail,
        subject: 'Your Subscription Has Been Canceled',
        body: `Your subscription has been canceled by an administrator. You will retain access until the end of your current billing period. If you have questions, please contact support.`,
        from_name: 'Billing Team'
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    return Response.json({
      success: true,
      subscription_id: canceledSub.id
    }, { status: 200 });
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});