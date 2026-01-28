import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      return Response.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Get customer's invoices by email/id
    const customerId = user.id || user.email;
    
    const invoicesResponse = await fetch(
      `https://api.xendit.co/v4/customers/${customerId}/invoices`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`
        }
      }
    );

    if (!invoicesResponse.ok) {
      console.error('Failed to fetch customer invoices');
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const invoicesData = await invoicesResponse.json();
    const activeInvoices = invoicesData.data?.filter((inv: any) => inv.status === 'ACTIVE') || [];

    if (activeInvoices.length === 0) {
      return Response.json({ error: 'No active invoices found' }, { status: 404 });
    }

    // Cancel all recurring charges associated with the customer
    const cancelledInvoiceIds = [];
    
    for (const invoice of activeInvoices) {
      if (invoice.recurring_charge_id) {
        try {
          const cancelResponse = await fetch(
            `https://api.xendit.co/v4/recurring_charges/${invoice.recurring_charge_id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${btoa(`${xenditSecretKey}:`)}`
              }
            }
          );

          if (cancelResponse.ok) {
            cancelledInvoiceIds.push(invoice.id);
          }
        } catch (error) {
          console.error(`Failed to cancel recurring charge ${invoice.recurring_charge_id}:`, error);
        }
      }
    }

    if (cancelledInvoiceIds.length === 0) {
      return Response.json({ error: 'Failed to cancel subscriptions' }, { status: 500 });
    }

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