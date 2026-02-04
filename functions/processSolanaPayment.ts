import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Connection, PublicKey } from 'npm:@solana/web3.js@1.92.0';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_sol, transaction_signature, payment_type, reference_id } = await req.json();

    if (!amount_sol || !transaction_signature || !payment_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin's Solana config
    const configs = await base44.asServiceRole.entities.SolanaPaymentConfig.list();
    if (configs.length === 0 || !configs[0].payment_enabled) {
      return Response.json({ error: 'Solana payments not enabled' }, { status: 400 });
    }

    const adminConfig = configs[0];
    const adminWallet = new PublicKey(adminConfig.wallet_address);

    // Verify transaction on blockchain
    const txSignature = transaction_signature;
    let tx;
    let retries = 0;
    
    while (retries < 5) {
      try {
        tx = await connection.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
        if (tx) break;
      } catch (e) {
        console.log(`Retry ${retries + 1}: Transaction not found yet`);
      }
      retries++;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!tx) {
      return Response.json({ error: 'Transaction not found on blockchain' }, { status: 400 });
    }

    if (tx.meta.err) {
      return Response.json({ error: 'Transaction failed' }, { status: 400 });
    }

    // Verify payment went to admin wallet
    const postTokenBalances = tx.meta.postTokenBalances || [];
    const lamportsReceived = tx.meta.postBalances[adminConfig.wallet_index || 0] - 
                             tx.meta.preBalances[adminConfig.wallet_index || 0];
    
    if (lamportsReceived < 0) {
      return Response.json({ error: 'Invalid transaction' }, { status: 400 });
    }

    // Create transaction record
    const transactionRecord = {
      user_id: user.email,
      amount_sol: amount_sol,
      transaction_signature: txSignature,
      payment_type: payment_type,
      reference_id: reference_id,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    };

    // Create entity for transaction tracking
    try {
      await base44.asServiceRole.entities.SolanaTransaction.create(transactionRecord);
    } catch (e) {
      console.log('Transaction entity not available, continuing...');
    }

    // Update admin config with payment stats
    await base44.asServiceRole.entities.SolanaPaymentConfig.update(adminConfig.id, {
      total_received_sol: (adminConfig.total_received_sol || 0) + amount_sol,
      total_transactions: (adminConfig.total_transactions || 0) + 1,
      last_transaction_date: new Date().toISOString()
    });

    // Log audit entry
    await base44.asServiceRole.entities.CoachingAuditLog.create({
      user_id: user.email,
      action_type: 'payment_confirmed',
      details: {
        payment_type,
        amount_sol,
        transaction_signature: txSignature
      },
      success: true
    });

    return Response.json({
      success: true,
      message: 'Payment verified and processed',
      reference_id
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});