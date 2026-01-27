import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_id } = await req.json();

    if (!integration_id) {
      return Response.json({ error: 'Integration ID required' }, { status: 400 });
    }

    const integration = await base44.entities.ExternalBotIntegration.get(integration_id);

    if (!integration) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (!integration.is_active) {
      return Response.json({ error: 'Integration is paused' }, { status: 403 });
    }

    // Trigger sync based on type
    if (integration.integration_type === 'api_polling' && integration.api_endpoint) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        if (integration.authentication?.type === 'api_key' && integration.authentication.api_key_header) {
          // In production, retrieve secret from environment
          headers[integration.authentication.api_key_header] = 'stored-api-key';
        }

        const response = await fetch(integration.api_endpoint, {
          method: integration.api_method || 'GET',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          
          await base44.entities.ExternalBotIntegration.update(integration.id, {
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            success_count: (integration.success_count || 0) + 1
          });

          return Response.json({
            success: true,
            message: 'Sync completed successfully',
            records: Array.isArray(data) ? data.length : 1
          }, { status: 200 });
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (error) {
        await base44.entities.ExternalBotIntegration.update(integration.id, {
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'error',
          error_count: (integration.error_count || 0) + 1
        });

        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    return Response.json({
      success: true,
      message: 'Sync triggered'
    }, { status: 200 });
  } catch (error) {
    console.error('Trigger sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});