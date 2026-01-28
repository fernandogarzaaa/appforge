import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get all invoices (representing customer subscriptions in Xendit)
    const subResponse = await fetch(
      'https://api.xendit.co/v4/invoices?limit=100',
      {
        headers: { 'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`},
      }
    );

    if (!subResponse.ok) {
      console.error('Failed to fetch invoices');
      return Response.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    const subData = await subResponse.json();
    const allInvoices = subData.data || [];

    const activeInvoices = allInvoices.filter((i: any) => i.status === 'PAID' || i.status === 'PENDING');
    const expiredInvoices = allInvoices.filter((i: any) => i.status === 'EXPIRED');

    // Calculate MRR from active invoices
    const mrr = activeInvoices.reduce((total: number, inv: any) => {
      return total + (inv.amount / 100);
    }, 0);

    // Calculate churn rate (30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentExpirations = expiredInvoices.filter((inv: any) => {
      const expiredAt = inv.updated || 0;
      return expiredAt > thirtyDaysAgo;
    }).length;

    const churnRate = allInvoices.length > 0
      ? (recentExpirations / allInvoices.length) * 100
      : 0;

    return Response.json({
      total_subscribers: allInvoices.length,
      active_subscriptions: activeInvoices.length,
      expired_subscriptions: expiredInvoices.length,
      mrr: mrr,
      churn_rate: churnRate,
      growth_rate: 0
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription metrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});