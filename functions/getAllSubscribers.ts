import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Plan mapping for PayMongo invoices (placeholder)
const planMapping = {
  'basic': { name: 'Basic', price: 20 },
  'pro': { name: 'Pro', price: 30 },
  'premium': { name: 'Premium', price: 99 }
};

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

    // PayMongo subscriber listing pending Billing API wiring; return empty array.
    return Response.json([], { status: 200 });
  } catch (error) {
    console.error('Get all subscribers error:', error);
    return Response.json([], { status: 200 });
  }
});