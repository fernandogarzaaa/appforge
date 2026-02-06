import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const txns = await base44.asServiceRole.entities.SolanaTransaction.list('-created_at', 50);
    const userTxns = txns.filter((tx: any) => tx.user_id === user.email);

    return Response.json(userTxns);
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load billing history' }, { status: 500 });
  }
});
