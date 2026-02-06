import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const subs = await base44.asServiceRole.entities.UserSubscription.list('-started_at', 500);
    const active = subs.filter((s: any) => s.status === 'active');
    const canceled = subs.filter((s: any) => s.status === 'canceled');

    const mrrSol = active.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);

    return Response.json({
      total_subscribers: subs.length,
      active_subscriptions: active.length,
      canceled_subscriptions: canceled.length,
      mrr_sol: mrrSol,
      churn_rate: subs.length ? (canceled.length / subs.length) * 100 : 0
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load metrics' }, { status: 500 });
  }
});
