import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json({
      error: 'Legacy webhook endpoint disabled',
      message: 'Xendit/PayMongo webhooks are deprecated. Use Solana/Phantom payment flows.'
    }, { status: 410 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
