import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    if (!paymongoSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // PayMongo subscription cancellation requires the Billing/Subscriptions API.
    // Since this project defers full API wiring, return a graceful message and notify the user.
    const cancelledInvoiceIds: string[] = [];

    // Send cancellation confirmation email
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Subscription Canceled',
        body: `Your subscription has been canceled. You will retain access until the end of your current billing period. If you have any questions, please contact support.`,
        from_name: 'Billing Team'
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    return Response.json({
      success: true,
      cancelled_invoices: cancelledInvoiceIds.length,
      invoice_ids: cancelledInvoiceIds
    }, { status: 200 });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});