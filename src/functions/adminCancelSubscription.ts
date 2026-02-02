import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { recurring_charge_id } = await req.json();

    if (!recurring_charge_id) {
      return Response.json({ error: 'Missing recurring_charge_id' }, { status: 400 });
    }

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    if (!paymongoSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // PayMongo cancellation is handled via Billing API; respond with guidance for now.
    return Response.json({
      success: false,
      recurring_charge_id,
      message: 'Cancel subscription via PayMongo dashboard or wire the Billing API call here.'
    }, { status: 202 });
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});