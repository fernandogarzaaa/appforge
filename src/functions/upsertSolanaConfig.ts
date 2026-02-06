import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const isAdminUser = (user: any) =>
  user?.role === 'admin' || (Array.isArray(user?.roles) && user.roles.includes('admin'));

const normalizeNetwork = (value?: string) => {
  const network = String(value || '').toLowerCase();
  if (network === 'devnet' || network === 'testnet' || network === 'mainnet-beta') {
    return network;
  }
  return 'mainnet-beta';
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminUser(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const walletAddress = String(payload.wallet_address || '').trim();
    const network = normalizeNetwork(payload.network || Deno.env.get('SOLANA_NETWORK'));
    const paymentEnabled = Boolean(payload.payment_enabled);
    const pricePerAnalysis = payload.price_per_analysis;
    const pricePerWorkflow = payload.price_per_workflow;

    if (!walletAddress) {
      return Response.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      wallet_address: walletAddress,
      network,
      payment_enabled: paymentEnabled
    };

    if (pricePerAnalysis !== undefined) {
      updatePayload.price_per_analysis = Number(pricePerAnalysis);
    }
    if (pricePerWorkflow !== undefined) {
      updatePayload.price_per_workflow = Number(pricePerWorkflow);
    }

    const configs = await base44.asServiceRole.entities.SolanaPaymentConfig.list();
    let config = configs[0] || null;

    if (config) {
      config = await base44.asServiceRole.entities.SolanaPaymentConfig.update(config.id, updatePayload);
    } else {
      config = await base44.asServiceRole.entities.SolanaPaymentConfig.create(updatePayload);
    }

    return Response.json(config);
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to save Solana config' }, { status: 500 });
  }
});
