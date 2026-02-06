import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const getEnvDefaults = () => ({
  wallet: Deno.env.get('SOLANA_ADMIN_WALLET') || '',
  network: Deno.env.get('SOLANA_NETWORK') || 'mainnet-beta'
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wallet: envWallet, network: envNetwork } = getEnvDefaults();
    const configs = await base44.asServiceRole.entities.SolanaPaymentConfig.list();
    let config = configs[0] || null;

    if (!config) {
      if (envWallet) {
        config = await base44.asServiceRole.entities.SolanaPaymentConfig.create({
          wallet_address: envWallet,
          network: envNetwork,
          payment_enabled: true
        });
      } else {
        return Response.json({
          wallet_address: '',
          network: envNetwork,
          payment_enabled: false
        });
      }
    }

    if (config && !config.wallet_address && envWallet) {
      config = await base44.asServiceRole.entities.SolanaPaymentConfig.update(config.id, {
        wallet_address: envWallet,
        network: config.network || envNetwork,
        payment_enabled: config.payment_enabled ?? true
      });
    }

    if (config && !config.network) {
      config = await base44.asServiceRole.entities.SolanaPaymentConfig.update(config.id, {
        network: envNetwork
      });
    }

    return Response.json(config);
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load Solana config' }, { status: 500 });
  }
});
