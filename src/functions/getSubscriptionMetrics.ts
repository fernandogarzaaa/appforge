import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    if (!paymongoSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // PayMongo metrics require Billing API; return zeros until implemented.
    return Response.json({
      total_subscribers: 0,
      active_subscriptions: 0,
      expired_subscriptions: 0,
      mrr: 0,
      churn_rate: 0,
      growth_rate: 0,
      note: 'PayMongo metrics pending Billing API wiring'
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});