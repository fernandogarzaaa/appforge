import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id, price, transaction_signature } = await req.json();

    if (!template_id || price === undefined) {
      return Response.json({ error: 'Template ID and price required' }, { status: 400 });
    }

    const template = await base44.entities.BotTemplate.get(template_id);

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if already purchased
    const existingPurchases = await base44.entities.TemplatePurchase.filter({
      template_id,
      buyer_email: user.email
    });

    if (existingPurchases.length > 0) {
      return Response.json({ error: 'Already purchased' }, { status: 400 });
    }

    // Calculate revenue split
    const platformFeePercentage = 30;
    const platformFee = price * (platformFeePercentage / 100);
    const authorRevenue = price * ((100 - platformFeePercentage) / 100);

    if (price > 0) {
      if (!transaction_signature) {
        return Response.json({ error: 'Missing transaction_signature' }, { status: 400 });
      }
      const tx = await base44.asServiceRole.entities.SolanaTransaction.filter({
        transaction_signature
      });
      if (!tx.length) {
        return Response.json({ error: 'Payment not verified' }, { status: 400 });
      }
    }

    // Create a completed purchase record
    const purchase = await base44.entities.TemplatePurchase.create({
      template_id,
      buyer_email: user.email,
      price_paid: price,
      payment_method: price > 0 ? 'solana' : 'free',
      transaction_id: crypto.randomUUID(),
      transaction_signature: transaction_signature || null,
      status: 'completed',
      author_revenue: authorRevenue,
      platform_fee: platformFee
    });

    // Update template stats and author revenue
    await base44.entities.BotTemplate.update(template_id, {
      total_revenue: (template.total_revenue || 0) + authorRevenue,
      downloads_count: (template.downloads_count || 0) + 1
    });

    return Response.json({
      success: true,
      purchase,
      message: 'Purchase successful!'
    }, { status: 200 });
  } catch (error) {
    console.error('Purchase template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
