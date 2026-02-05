import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verify webhook signature for authenticity
 * Uses HMAC-SHA256 for signature verification
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { webhook_id, payload, signature } = await req.json();

    if (!webhook_id || !payload || !signature) {
      return Response.json(
        { error: 'Missing webhook_id, payload, or signature' },
        { status: 400 }
      );
    }

    // Get webhook
    const webhooks = await base44.asServiceRole.entities.Webhook.filter({
      id: webhook_id
    });

    if (webhooks.length === 0) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhook = webhooks[0];

    if (!webhook.secret) {
      return Response.json(
        { error: 'Webhook secret not configured' },
        { status: 400 }
      );
    }

    // Verify signature using HMAC-SHA256
    const isValid = await verifyHmacSignature(
      webhook.secret,
      JSON.stringify(payload),
      signature
    );

    return Response.json({
      valid: isValid,
      webhook_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Signature verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function verifyHmacSignature(secret, message, providedSignature) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const messageBuffer = encoder.encode(message);
  const signatureBuffer = hexToBuffer(providedSignature);

  try {
    return await crypto.subtle.verify('HMAC', key, signatureBuffer, messageBuffer);
  } catch {
    return false;
  }
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}