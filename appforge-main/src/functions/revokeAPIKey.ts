import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_id } = await req.json();

    if (!key_id) {
      return Response.json({ error: 'Key ID required' }, { status: 400 });
    }

    // Revoke the key
    await base44.entities.APIKey.update(key_id, {
      is_active: false,
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: user.email
    });

    return Response.json({
      success: true,
      message: 'API key revoked successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});