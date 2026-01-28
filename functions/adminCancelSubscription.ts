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

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get the recurring charge to find customer email
    const chargeResponse = await fetch(
      `https://api.xendit.co/v4/recurring_charges/${recurring_charge_id}`,
      {
        headers: { 'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`},
      }
    );

    if (!chargeResponse.ok) {
      return Response.json({ error: 'Recurring charge not found' }, { status: 404 });
    }

    const charge = await chargeResponse.json();
    const customerEmail = charge.customer_email || charge.customer_id;

    // Cancel the recurring charge
    const cancelResponse = await fetch(
      `https://api.xendit.co/v4/recurring_charges/${recurring_charge_id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}` },
      }
    );

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json();
      console.error('Xendit error:', error);
      return Response.json({ error: 'Failed to cancel recurring charge' }, { status: 500 });
    }

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

    console.log(`Admin canceled recurring charge ${recurring_charge_id}`);

    return Response.json({
      success: true,
      recurring_charge_id: recurring_charge_id
    }, { status: 200 });
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});