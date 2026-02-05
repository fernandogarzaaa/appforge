import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { generateRandomString } from './utils/apiKeyUtils.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, scopes = ['read:projects', 'read:entities'] } = await req.json();

    if (!name) {
      return Response.json({ error: 'API key name required' }, { status: 400 });
    }

    // Generate secure API key
    const keyId = `key_${generateRandomString(16)}`;
    const keySecret = `secret_${generateRandomString(32)}`;
    const hashedSecret = await hashSecret(keySecret);

    // Store API key in database
    const apiKey = await base44.asServiceRole.entities.APIKey.create({
      user_id: user.email,
      name: name,
      key_id: keyId,
      key_secret_hashed: hashedSecret,
      scopes: scopes,
      is_active: true,
      last_used: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Log audit entry
    await base44.asServiceRole.entities.CoachingAuditLog.create({
      user_id: user.email,
      action_type: 'api_key_created',
      details: { key_id: keyId, scopes },
      success: true
    });

    return Response.json({
      success: true,
      api_key: {
        id: apiKey.id,
        key_id: keyId,
        key_secret: keySecret, // Only returned once
        name: apiKey.name,
        scopes: apiKey.scopes,
        created_at: apiKey.created_at,
        expires_at: apiKey.expires_at
      },
      message: 'API key created. Save the secret key - it will not be shown again.'
    });
  } catch (error) {
    console.error('API key creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function hashSecret(secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}