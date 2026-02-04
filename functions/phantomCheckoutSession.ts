import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Stable token prices in USDC (6 decimals)
const planPrices = {
  solana_basic_plan: { name: 'Basic', amount: 20000000, decimals: 6 }, // 20 USDC
  solana_pro_plan: { name: 'Pro', amount: 30000000, decimals: 6 }, // 30 USDC
  solana_premium_plan: { name: 'Premium', amount: 99000000, decimals: 6 } // 99 USDC
};

// USDC mint address on Solana (mainnet)
const USDC_MINT = 'EPjFWaLb3odcccccccccccccccccccccccccccccccccccccccccccccccccccccc';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, walletAddress } = body;

    if (!priceId || !walletAddress) {
      return Response.json({ error: 'Missing priceId or walletAddress' }, { status: 400 });
    }

    const planInfo = planPrices[priceId];
    if (!planInfo) {
      return Response.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Generate a unique transaction reference
    const txReference = `${user.id || user.email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return Response.json({
      success: true,
      transaction: {
        reference: txReference,
        amount: planInfo.amount,
        decimals: planInfo.decimals,
        mint: USDC_MINT,
        recipient: Deno.env.get('SOLANA_PAYMENT_WALLET') || 'SolanaPaymentWalletAddressHere',
        label: `${planInfo.name} Plan Subscription`,
        memo: `AppForge ${planInfo.name} Plan`,
        message: `Subscribe to ${planInfo.name} plan for 30 days`
      },
      metadata: {
        user_email: user.email,
        plan_name: planInfo.name,
        plan_id: priceId,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Phantom checkout session error:', error);
    return Response.json({ error: error.message || 'Failed to create payment session' }, { status: 500 });
  }
});