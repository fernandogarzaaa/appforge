import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
      return Response.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const subData = await subResponse.json();
    const allSubscriptions = subData.data;

    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active');
    const canceledSubscriptions = allSubscriptions.filter(s => s.status === 'canceled');

    // Calculate MRR
    const mrr = activeSubscriptions.reduce((total, sub) => {
      const price = sub.items.data[0]?.price?.unit_amount || 0;
      return total + price / 100;
    }, 0);

    // Calculate churn rate (30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentCancellations = canceledSubscriptions.filter(s => {
      const canceledAt = s.canceled_at || 0;
      return canceledAt > thirtyDaysAgo;
    }).length;

    const churnRate = allSubscriptions.length > 0
      ? (recentCancellations / allSubscriptions.length) * 100
      : 0;

    return Response.json({
      total_subscribers: allSubscriptions.length,
      active_subscriptions: activeSubscriptions.length,
      canceled_subscriptions: canceledSubscriptions.length,
      mrr: mrr,
      churn_rate: churnRate,
      growth_rate: 0
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});