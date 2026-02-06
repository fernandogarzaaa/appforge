import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature } = await req.json();
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    const txs = await base44.asServiceRole.entities.SolanaTransaction.filter({
      transaction_signature: signature
    });
    if (!txs.length) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const tx = txs[0];
    return Response.json(tx);
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load receipt' }, { status: 500 });
  }
});
