import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, key_type, service_name, environment, plain_value, scopes, expires_at } = await req.json();

    if (!name || !plain_value) {
      return Response.json({ error: 'Name and key value are required' }, { status: 400 });
    }

    // Generate key prefix (first 8 chars for display)
    const keyPrefix = plain_value.substring(0, 8);

    // Encrypt the value using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(plain_value);
    
    // Require encryption key from environment
    const encryptionKey = Deno.env.get('API_KEY_ENCRYPTION_SECRET');
    if (!encryptionKey) {
      return Response.json({ error: 'API_KEY_ENCRYPTION_SECRET environment variable not configured' }, { status: 500 });
    }
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionKey.padEnd(32, '0').substring(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    const encryptedValue = btoa(String.fromCharCode(...combined));

    // Create API key record
    const apiKey = await base44.entities.APIKey.create({
      name,
      key_type: key_type || 'api_key',
      service_name: service_name || null,
      key_prefix: keyPrefix,
      encrypted_value: encryptedValue,
      environment: environment || 'production',
      scopes: scopes || [],
      expires_at: expires_at || null,
      is_active: true,
      is_revoked: false,
      usage_count: 0,
      metadata: {
        created_by: user.email
      }
    });

    // Return both the encrypted key record and the plain value (only shown once)
    return Response.json({
      success: true,
      key: apiKey,
      plain_value: plain_value, // Only returned on creation
      message: 'API key created successfully. Save this key - you won\'t see it again!'
    }, { status: 200 });
  } catch (error) {
    console.error('Generate API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});