import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_sol, payment_type, reference_id } = await req.json();

    if (!amount_sol || !payment_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin wallet from config
    const configs = await base44.asServiceRole.entities.SolanaPaymentConfig.list();
    if (configs.length === 0 || !configs[0].payment_enabled) {
      return Response.json({ error: 'Solana payments not enabled' }, { status: 400 });
    }

    const adminConfig = configs[0];

    // Create Phantom Checkout transaction
    // Phantom Checkout API endpoint
    const phantomResponse = await fetch('https://api.phantom.app/v1/checkout/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant: adminConfig.wallet_address,
        amount: amount_sol,
        currency: 'SOL',
        reference: reference_id,
        label: `Payment for ${payment_type}`,
        icon: 'https://phantom.app/logo.png',
        redirect: `${Deno.env.get('BASE44_APP_URL')}/payment-success?tx={txId}&type=${payment_type}&ref=${reference_id}`,
      }),
    });

    if (!phantomResponse.ok) {
      throw new Error('Failed to create Phantom checkout');
    }

    const checkoutData = await phantomResponse.json();

    // Log audit entry
    await base44.asServiceRole.entities.CoachingAuditLog.create({
      user_id: user.email,
      action_type: 'checkout_initiated',
      details: {
        payment_type,
        amount_sol,
        reference_id,
        checkout_id: checkoutData.checkoutId,
      },
      success: true,
    });

    return Response.json({
      success: true,
      checkout_url: checkoutData.url,
      checkout_id: checkoutData.checkoutId,
    });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});