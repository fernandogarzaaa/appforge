import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getCustomerInvoices } from '../src/functions/utils/xenditClient.ts';

const planPrices = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': { name: 'Basic', price: 20 },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': { name: 'Pro', price: 30 },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': { name: 'Premium', price: 99 }
};

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

    try {
      // Get customer invoices from Xendit
      const invoices = await getCustomerInvoices(user.email);

      if (!invoices || invoices.length === 0) {
        // No subscription found
        return Response.json(null, { status: 200 });
      }

      // Find the most recent active/recurring invoice
      const activeInvoice = invoices.find((inv: any) => 
        inv.status === 'PENDING' || inv.status === 'PAID' || inv.recurring_charge_id
      );

      if (!activeInvoice) {
        // No active subscription
        return Response.json(null, { status: 200 });
      }

      // Extract plan info from metadata or description
      const priceId = activeInvoice.metadata?.price_id;
      const planInfo = priceId ? planPrices[priceId] : null;
      
      // Determine plan from amount if not in metadata
      let planName = planInfo?.name || 'Unknown';
      let planPrice = planInfo?.price || activeInvoice.amount;

      if (!planInfo) {
        // Fallback: guess plan from amount
        const amount = activeInvoice.amount;
        if (amount === 20) planName = 'Basic';
        else if (amount === 30) planName = 'Pro';
        else if (amount === 99) planName = 'Premium';
        planPrice = amount;
      }

      return Response.json({
        id: activeInvoice.id,
        status: activeInvoice.status === 'PAID' ? 'active' : activeInvoice.status.toLowerCase(),
        plan: planName,
        amount: planPrice,
        currency: activeInvoice.currency || 'USD',
        current_period_start: activeInvoice.created,
        current_period_end: activeInvoice.expiry_date,
        cancel_at_period_end: activeInvoice.status === 'EXPIRED' || !activeInvoice.recurring_charge_id,
        customer_email: user.email,
        invoice_url: activeInvoice.invoice_url
      }, { status: 200 });
    } catch (error) {
      console.error('Xendit error:', error);
      return Response.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
  } catch (error) {
    console.error('Subscription info error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
      plan_name: planInfo.name,
      price: planInfo.price,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      customer_email: customer.email
    }, { status: 200 });
  } catch (error) {
    console.error('Get subscription info error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});