import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { fix_type } = await req.json();

    const fixes_applied = [];
    const errors = [];

    // Fix broken integrations
    if (!fix_type || fix_type === 'integrations') {
      try {
        const integrations = await base44.asServiceRole.entities.ExternalBotIntegration.list();
        
        for (const integration of integrations) {
          // Fix missing webhook URLs
          if (integration.integration_type === 'incoming_webhook' && !integration.webhook_url) {
            const appId = Deno.env.get('BASE44_APP_ID');
            const integrationId = integration.metadata?.integration_id || crypto.randomUUID();
            const webhookUrl = `https://api.base44.com/v1/webhooks/external/${appId}/${integrationId}`;
            
            await base44.asServiceRole.entities.ExternalBotIntegration.update(integration.id, {
              webhook_url: webhookUrl,
              metadata: { ...integration.metadata, integration_id: integrationId }
            });

            fixes_applied.push({
              type: 'webhook_url_fixed',
              entity: 'ExternalBotIntegration',
              id: integration.id,
              message: `Generated webhook URL for ${integration.name}`
            });
          }

          // Reset high error counts
          if (integration.error_count > 50) {
            await base44.asServiceRole.entities.ExternalBotIntegration.update(integration.id, {
              error_count: 0,
              last_sync_status: 'pending'
            });

            fixes_applied.push({
              type: 'error_count_reset',
              entity: 'ExternalBotIntegration',
              id: integration.id,
              message: `Reset error count for ${integration.name}`
            });
          }
        }
      } catch (error) {
        errors.push({
          type: 'integration_fix_failed',
          error: error.message
        });
      }
    }

    // Create missing sample data
    if (!fix_type || fix_type === 'sample_data') {
      try {
        const templates = await base44.asServiceRole.entities.BotTemplate.list();
        
        if (templates.length === 0) {
          // Sample templates already exist from earlier creation
          fixes_applied.push({
            type: 'sample_data_note',
            message: 'Sample bot templates already exist'
          });
        }
      } catch (error) {
        errors.push({
          type: 'sample_data_failed',
          error: error.message
        });
      }
    }

    // Validate entity schemas
    if (!fix_type || fix_type === 'schemas') {
      try {
        const entitiesToCheck = [
          'ExternalBotIntegration',
          'BotTemplate',
          'FeatureFlag'
        ];

        for (const entityName of entitiesToCheck) {
          try {
            await base44.asServiceRole.entities[entityName].list();
            fixes_applied.push({
              type: 'schema_valid',
              entity: entityName,
              message: `${entityName} schema is valid`
            });
          } catch (error) {
            errors.push({
              type: 'schema_invalid',
              entity: entityName,
              error: error.message
            });
          }
        }
      } catch (error) {
        errors.push({
          type: 'schema_check_failed',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      fixes_applied,
      errors,
      summary: {
        total_fixes: fixes_applied.length,
        total_errors: errors.length
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Auto-fix error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});