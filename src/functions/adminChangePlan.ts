import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logger } from './utils/logger.ts';

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

    // PayMongo plan changes currently require managing subscriptions via Billing API or dashboard.
    // To avoid breaking flows, return a controlled response indicating manual action is needed.
    logger.warn('PayMongo plan change requested; handle via dashboard or implement Subscription API call.');

    return Response.json({
      success: false,
      message: 'Change plan via PayMongo dashboard or implement Subscription API hookup.',
      recurring_charge_id,
      new_plan_amount
    }, { status: 202 });
  } catch (error) {
    logger.error('Admin change plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});