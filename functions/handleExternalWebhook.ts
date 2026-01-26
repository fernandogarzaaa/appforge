import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    // Extract integration ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const integrationId = pathParts[pathParts.length - 1];

    if (!integrationId) {
      return Response.json({ error: 'Integration ID required' }, { status: 400 });
    }

    // Find integration
    const integrations = await base44.asServiceRole.entities.ExternalBotIntegration.filter({
      'metadata.integration_id': integrationId
    });

    if (integrations.length === 0) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = integrations[0];

    if (!integration.is_active) {
      return Response.json({ error: 'Integration is paused' }, { status: 403 });
    }

    // Parse incoming data
    const payload = await req.json();
    console.log('Received webhook data:', payload);

    // Store to target entity if configured
    if (integration.target_entity) {
      try {
        await base44.asServiceRole.entities[integration.target_entity].create({
          ...payload,
          source_integration: integration.id,
          received_at: new Date().toISOString()
        });

        // Update success count
        await base44.asServiceRole.entities.ExternalBotIntegration.update(integration.id, {
          success_count: (integration.success_count || 0) + 1,
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success'
        });
      } catch (entityError) {
        console.error('Entity creation error:', entityError);
        
        // Update error count
        await base44.asServiceRole.entities.ExternalBotIntegration.update(integration.id, {
          error_count: (integration.error_count || 0) + 1,
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'error'
        });

        return Response.json({ 
          error: 'Failed to store data',
          details: entityError.message 
        }, { status: 500 });
      }
    }

    // Log the webhook call
    console.log(`Webhook processed for integration: ${integration.name}`);

    return Response.json({ 
      success: true,
      integration_name: integration.name,
      received_at: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});