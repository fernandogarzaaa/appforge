import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// PayMongo plan change placeholder

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { recurring_charge_id, new_plan_amount } = await req.json();

    if (!recurring_charge_id || !new_plan_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    if (!paymongoSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // PayMongo plan changes must be handled via Billing API or dashboard.
    return Response.json({
      success: false,
      recurring_charge_id,
      new_plan_amount,
      message: 'Change plan via PayMongo dashboard or add Billing API call here.'
    }, { status: 202 });
  } catch (error) {
    console.error('Admin change plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});