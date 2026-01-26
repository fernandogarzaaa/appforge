import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { name, platform, integration_type, api_endpoint, api_method, target_entity, authentication } = data;

    if (!name || !platform || !integration_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate webhook URL for incoming integrations
    const appId = Deno.env.get('BASE44_APP_ID');
    const integrationId = crypto.randomUUID();
    const webhookUrl = integration_type === 'incoming_webhook' || integration_type === 'bidirectional'
      ? `https://api.base44.com/v1/webhooks/external/${appId}/${integrationId}`
      : null;

    // Create integration record
    const integration = await base44.entities.ExternalBotIntegration.create({
      name,
      platform,
      integration_type,
      webhook_url: webhookUrl,
      api_endpoint: api_endpoint || null,
      api_method: api_method || 'POST',
      target_entity: target_entity || null,
      authentication: authentication || { type: 'none' },
      is_active: true,
      success_count: 0,
      error_count: 0,
      configuration: {},
      metadata: {
        created_by: user.email,
        integration_id: integrationId
      }
    });

    return Response.json({
      success: true,
      integration,
      webhook_url: webhookUrl,
      message: 'Integration created successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Create integration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});