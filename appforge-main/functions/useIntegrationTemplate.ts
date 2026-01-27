import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id } = await req.json();

    if (!template_id) {
      return Response.json({ error: 'Template ID required' }, { status: 400 });
    }

    const template = await base44.entities.IntegrationTemplate.get(template_id);

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create integration from template
    const appId = Deno.env.get('BASE44_APP_ID');
    const integrationId = crypto.randomUUID();
    
    const integration = await base44.entities.ExternalBotIntegration.create({
      name: template.name,
      platform: template.platform,
      integration_type: template.config_template?.integration_type || 'incoming_webhook',
      webhook_url: `https://api.base44.com/v1/webhooks/external/${appId}/${integrationId}`,
      data_mapping: {
        input_fields: template.field_mappings || [],
        output_fields: []
      },
      is_active: true,
      metadata: {
        created_from_template: template_id,
        integration_id: integrationId
      }
    });

    // Update template usage count
    await base44.entities.IntegrationTemplate.update(template_id, {
      usage_count: (template.usage_count || 0) + 1
    });

    return Response.json({
      success: true,
      integration,
      message: 'Integration created from template'
    }, { status: 200 });
  } catch (error) {
    console.error('Use template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});