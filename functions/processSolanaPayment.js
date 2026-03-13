import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Connection } from 'npm:@solana/web3.js';
const getRpcUrl = (network) => {
    const envRpc = Deno.env.get('SOLANA_RPC_URL');
    if (envRpc)
        return envRpc;
    if (network === 'mainnet-beta')
        return 'https://api.mainnet-beta.solana.com';
    if (network === 'testnet')
        return 'https://api.testnet.solana.com';
    return 'https://api.devnet.solana.com';
};
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json();
        const amountSol = Number(payload.amount_sol);
        const signature = String(payload.transaction_signature || '');
        const paymentType = String(payload.payment_type || 'unknown');
        const referenceId = payload.reference_id || null;
        if (!signature || !Number.isFinite(amountSol) || amountSol <= 0) {
            return Response.json({ error: 'Invalid payment payload' }, { status: 400 });
        }
        const configs = await base44.asServiceRole.entities.SolanaPaymentConfig.list();
        let config = configs[0];
        if (!config || !config.wallet_address) {
            const envWallet = Deno.env.get('SOLANA_ADMIN_WALLET');
            const envNetwork = Deno.env.get('SOLANA_NETWORK') || 'devnet';
            if (envWallet) {
                if (config) {
                    config = await base44.asServiceRole.entities.SolanaPaymentConfig.update(config.id, {
                        wallet_address: envWallet,
                        network: config.network || envNetwork,
                        payment_enabled: config.payment_enabled ?? true
                    });
                }
                else {
                    config = await base44.asServiceRole.entities.SolanaPaymentConfig.create({
                        wallet_address: envWallet,
                        network: envNetwork,
                        payment_enabled: true
                    });
                }
            }
        }
        if (!config?.wallet_address) {
            return Response.json({ error: 'Solana wallet not configured' }, { status: 400 });
        }
        if (config.payment_enabled === false) {
            return Response.json({ error: 'Solana payments are disabled' }, { status: 400 });
        }
        const adminWallet = String(config.wallet_address);
        const network = String(config.network || 'devnet');
        const connection = new Connection(getRpcUrl(network), 'confirmed');
        const parsed = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0
        });
        if (!parsed || parsed.meta?.err) {
            return Response.json({ error: 'Transaction not confirmed' }, { status: 400 });
        }
        let totalLamports = 0;
        let payer = '';
        const instructions = parsed.transaction.message.instructions || [];
        for (const ix of instructions) {
            if ('parsed' in ix && ix.parsed?.type === 'transfer') {
                const info = ix.parsed.info;
                if (info?.destination === adminWallet && info?.lamports) {
                    totalLamports += Number(info.lamports);
                    payer = info.source || payer;
                }
            }
        }
        const expectedLamports = Math.round(amountSol * 1_000_000_000);
        if (totalLamports < expectedLamports) {
            return Response.json({ error: 'Transferred amount is insufficient' }, { status: 400 });
        }
        await base44.asServiceRole.entities.SolanaTransaction.create({
            user_id: user.email,
            transaction_signature: signature,
            amount_sol: amountSol,
            amount_lamports: totalLamports,
            payment_type: paymentType,
            reference_id: referenceId,
            wallet_from: payer || null,
            wallet_to: adminWallet,
            network,
            status: 'confirmed',
            created_at: new Date().toISOString()
        });
        return Response.json({ success: true });
    }
    catch (error) {
        return Response.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
    }
});
