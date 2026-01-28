import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function should only be called by other backend functions (service role)
    const { key_id } = await req.json();

    if (!key_id) {
      return Response.json({ error: 'Key ID required' }, { status: 400 });
    }

    // Get the API key using service role
    const apiKey = await base44.asServiceRole.entities.APIKey.get(key_id);

    if (!apiKey) {
      return Response.json({ error: 'API key not found' }, { status: 404 });
    }

    if (!apiKey.is_active || apiKey.is_revoked) {
      return Response.json({ error: 'API key is not active' }, { status: 403 });
    }

    // Decrypt the value
    const encryptionKey = Deno.env.get('API_KEY_ENCRYPTION_SECRET');
    if (!encryptionKey) {
      return Response.json({ error: 'API_KEY_ENCRYPTION_SECRET environment variable not configured' }, { status: 500 });
    }
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionKey.padEnd(32, '0').substring(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decode base64
    const combined = Uint8Array.from(atob(apiKey.encrypted_value), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      encryptedData
    );

    const plainValue = decoder.decode(decryptedData);

    // Update usage stats
    await base44.asServiceRole.entities.APIKey.update(key_id, {
      last_used_at: new Date().toISOString(),
      usage_count: (apiKey.usage_count || 0) + 1
    });

    return Response.json({
      success: true,
      plain_value: plainValue,
      key_info: {
        name: apiKey.name,
        key_type: apiKey.key_type,
        service_name: apiKey.service_name
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Decrypt API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});