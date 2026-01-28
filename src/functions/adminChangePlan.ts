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

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // In Xendit, plan changes are handled by:
    // 1. Canceling the existing recurring charge
    // 2. Creating a new recurring charge with the new amount
    
    // Cancel existing recurring charge
    const cancelResponse = await fetch(
      `https://api.xendit.co/v4/recurring_charges/${recurring_charge_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`
        }
      }
    );

    if (!cancelResponse.ok) {
      logger.error('Failed to cancel recurring charge');
      return Response.json({ error: 'Failed to cancel existing plan' }, { status: 500 });
    }

    // Create new recurring charge with new amount
    const createResponse = await fetch(
      'https://api.xendit.co/v4/recurring_charges',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`
        },
        body: JSON.stringify({
          amount: new_plan_amount,
          interval: 'month',
          interval_count: 1
        })
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      logger.error('Xendit error:', error);
      return Response.json({ error: 'Failed to create new recurring charge' }, { status: 500 });
    }

    const newCharge = await createResponse.json();

    logger.info(`Admin changed plan from ${recurring_charge_id} to ${newCharge.id}`);

    return Response.json({
      success: true,
      recurring_charge_id: newCharge.id,
      amount: newCharge.amount
    }, { status: 200 });
  } catch (error) {
    logger.error('Admin change plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
});