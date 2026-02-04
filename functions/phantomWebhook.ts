import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { signature, amount, userEmail, planId } = body;

    if (!signature || !userEmail || !planId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production, verify the transaction on Solana blockchain
    // For now, we'll log and process the payment

    // Update user subscription in database
    try {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        const user = users[0];
        
        // Update subscription details
        await base44.auth.updateMe({
          subscription_status: 'active',
          subscription_plan: planId,
          subscription_tx_hash: signature,
          subscription_renewed_at: new Date().toISOString(),
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        return Response.json({
          success: true,
          message: 'Subscription activated',
          signature
        }, { status: 200 });
      }
    } catch (dbError) {
      console.error('Database update error:', dbError);
    }

    return Response.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Phantom webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});