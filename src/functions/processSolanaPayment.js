import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Connection, PublicKey } from 'npm:@solana/web3.js';
import { getAssociatedTokenAddressSync } from 'npm:@solana/spl-token';
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const getRpcUrl = () => {
    const envRpc = Deno.env.get('SOLANA_RPC_URL');
    if (envRpc)
        return envRpc;
    return 'https://api.mainnet-beta.solana.com';
};
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json();
        const amountUSDC = Number(payload.amount_paid);
        const signature = String(payload.transaction_signature || '');
        const planId = payload.plan_id;
        if (!signature || !Number.isFinite(amountUSDC) || amountUSDC <= 0) {
            return Response.json({ error: 'Invalid payment payload' }, { status: 400 });
        }
        const configs = await base44.asServiceRole.entities.SolanaPaymentConfig.list();
        const config = configs[0];
        if (!config?.wallet_address) {
            return Response.json({ error: 'Admin wallet not configured' }, { status: 400 });
        }
        const adminWallet = new PublicKey(String(config.wallet_address));
        const adminATA = getAssociatedTokenAddressSync(USDC_MINT, adminWallet);
        const adminATAString = adminATA.toString();
        const connection = new Connection(getRpcUrl(), 'confirmed');
        const parsed = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });
        if (!parsed || parsed.meta?.err) {
            return Response.json({ error: 'Transaction not found or failed' }, { status: 400 });
        }
        let totalUSDC = 0;
        // Check main instructions and inner instructions for SPL Token transfers
        const allInstructions = [
            ...(parsed.transaction.message.instructions || []),
            ...(parsed.meta?.innerInstructions?.flatMap(i => i.instructions) || [])
        ];
        for (const ix of allInstructions) {
            if ('parsed' in ix && (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked')) {
                const info = ix.parsed.info;
                // Check if destination matches Admin ATA
                if (info?.destination === adminATAString) {
                    // If mint is present (transferChecked), verify it
                    if (info.mint && info.mint !== USDC_MINT.toString())
                        continue;
                    // Get amount
                    // transferChecked has tokenAmount object
                    // transfer has amount (string or number)
                    let amount = 0;
                    if (info.tokenAmount) {
                        amount = Number(info.tokenAmount.amount);
                    }
                    else if (info.amount) {
                        amount = Number(info.amount);
                    }
                    totalUSDC += amount;
                }
            }
        }
        // Expected amount in raw units (USDC 6 decimals)
        const expectedRaw = Math.round(amountUSDC * 1_000_000);
        if (totalUSDC < expectedRaw) {
            return Response.json({
                error: `Insufficient payment. Received ${totalUSDC / 1e6} USDC, expected ${amountUSDC} USDC`
            }, { status: 400 });
        }
        // Record Transaction
        await base44.asServiceRole.entities.SolanaTransaction.create({
            user_id: user.email,
            transaction_signature: signature,
            amount_sol: 0,
            amount_usdc: amountUSDC,
            currency: 'USDC',
            plan_id: planId || null,
            network: 'mainnet-beta',
            status: 'confirmed',
            created_at: new Date().toISOString()
        });
        return Response.json({ success: true, verified_amount: totalUSDC / 1e6 });
    }
    catch (error) {
        console.error('Payment Error:', error);
        return Response.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
    }
});
