import crypto from 'node:crypto';

/**
 * Verify webhook signature for authenticity
 * Uses HMAC-SHA256 for signature verification
 */

Deno.serve(async (req) => {
  try {
    const { payload, signature, secret } = await req.json();

    if (!payload || !signature || !secret) {
      return Response.json(
        { error: 'Missing payload, signature, or secret' },
        { status: 400 }
      );
    }

    // Verify signature using HMAC-SHA256
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const isValid = verifyHmacSignature(secret, payloadString, signature);

    return Response.json({
      valid: isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Signature verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function verifyHmacSignature(secret, message, providedSignature) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  const computed = hmac.digest('hex');
  
  // Constant time comparison
  return computed === providedSignature;
}