import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      overall_health: 'good',
      errors: [],
      warnings: [],
      suggestions: [],
      stats: {}
    };

    // Check entities
    try {
      const entities = await base44.asServiceRole.entities.ExternalBotIntegration.list();
      diagnostics.stats.total_integrations = entities.length;
      diagnostics.stats.active_integrations = entities.filter(e => e.is_active).length;
      diagnostics.stats.failed_integrations = entities.filter(e => e.last_sync_status === 'error').length;

      // Check for integrations with errors
      entities.forEach(integration => {
        if (integration.error_count > 10) {
          diagnostics.warnings.push({
            type: 'high_error_count',
            severity: 'warning',
            entity: 'ExternalBotIntegration',
            id: integration.id,
            message: `Integration "${integration.name}" has ${integration.error_count} errors`,
            suggestion: 'Review integration configuration and logs'
          });
        }

        if (!integration.webhook_url && !integration.api_endpoint) {
          diagnostics.errors.push({
            type: 'missing_configuration',
            severity: 'error',
            entity: 'ExternalBotIntegration',
            id: integration.id,
            message: `Integration "${integration.name}" has no webhook URL or API endpoint`,
            suggestion: 'Add either webhook_url or api_endpoint'
          });
        }
      });
    } catch (error) {
      diagnostics.warnings.push({
        type: 'entity_check_failed',
        severity: 'warning',
        message: 'Could not check ExternalBotIntegration entity',
        error: error.message
      });
    }

    // Check BotTemplate data
    try {
      const templates = await base44.asServiceRole.entities.BotTemplate.list();
      diagnostics.stats.total_templates = templates.length;
      diagnostics.stats.featured_templates = templates.filter(t => t.is_featured).length;

      if (templates.length === 0) {
        diagnostics.warnings.push({
          type: 'no_templates',
          severity: 'info',
          message: 'No bot templates found',
          suggestion: 'Create sample templates to help users get started'
        });
      }
    } catch (error) {
      diagnostics.warnings.push({
        type: 'entity_check_failed',
        severity: 'warning',
        message: 'Could not check BotTemplate entity',
        error: error.message
      });
    }

    // Check FeatureFlags
    try {
      const flags = await base44.asServiceRole.entities.FeatureFlag.list();
      diagnostics.stats.total_feature_flags = flags.length;
      diagnostics.stats.enabled_flags = flags.filter(f => f.enabled).length;
    } catch (error) {
      diagnostics.warnings.push({
        type: 'entity_check_failed',
        severity: 'warning',
        message: 'Could not check FeatureFlag entity',
        error: error.message
      });
    }

    // API Suggestions
    diagnostics.suggestions.push({
      category: 'API Architecture',
      priority: 'high',
      items: [
        {
          title: 'Implement Rate Limiting',
          description: 'Add rate limiting to external webhook endpoints to prevent abuse',
          implementation: 'Use Deno KV or external service like Upstash Redis for rate limiting'
        },
        {
          title: 'Add Request Validation',
          description: 'Validate incoming webhook payloads against schemas',
          implementation: 'Use Zod or JSON Schema validation in webhook handlers'
        },
        {
          title: 'Implement Retry Logic',
          description: 'Add exponential backoff for failed API calls',
          implementation: 'Create a retry wrapper function with configurable attempts'
        },
        {
          title: 'Add Webhook Signature Verification',
          description: 'Verify webhook signatures to ensure requests are authentic',
          implementation: 'Implement HMAC signature verification for each platform'
        }
      ]
    });

    diagnostics.suggestions.push({
      category: 'Data Management',
      priority: 'medium',
      items: [
        {
          title: 'Add Data Cleanup Jobs',
          description: 'Archive or delete old integration logs to prevent database bloat',
          implementation: 'Create scheduled automation to clean logs older than 30 days'
        },
        {
          title: 'Implement Data Encryption',
          description: 'Encrypt sensitive fields like API keys and tokens',
          implementation: 'Use Web Crypto API for encryption before storing'
        },
        {
          title: 'Add Audit Trail',
          description: 'Log all changes to integrations for compliance',
          implementation: 'Create AuditLog entity and log all CRUD operations'
        }
      ]
    });

    diagnostics.suggestions.push({
      category: 'Performance',
      priority: 'medium',
      items: [
        {
          title: 'Implement Caching',
          description: 'Cache frequently accessed integration configs',
          implementation: 'Use Deno KV or in-memory cache with TTL'
        },
        {
          title: 'Batch Webhook Processing',
          description: 'Process multiple webhook events in batches',
          implementation: 'Queue webhooks and process in batches of 10-50'
        },
        {
          title: 'Add Connection Pooling',
          description: 'Reuse HTTP connections for external API calls',
          implementation: 'Configure fetch with keepalive and connection limits'
        }
      ]
    });

    diagnostics.suggestions.push({
      category: 'Security',
      priority: 'high',
      items: [
        {
          title: 'IP Whitelisting',
          description: 'Allow webhooks only from trusted IP ranges',
          implementation: 'Add IP validation in webhook handler'
        },
        {
          title: 'Secrets Management',
          description: 'Never log or expose API keys in responses',
          implementation: 'Sanitize all logs and error messages'
        },
        {
          title: 'CORS Configuration',
          description: 'Properly configure CORS for API endpoints',
          implementation: 'Set appropriate CORS headers based on environment'
        }
      ]
    });

    // Best Practices
    diagnostics.suggestions.push({
      category: 'Best Practices',
      priority: 'low',
      items: [
        {
          title: 'Add Health Check Endpoint',
          description: 'Create endpoint to verify API availability',
          implementation: 'Simple endpoint that returns status and version'
        },
        {
          title: 'Implement Monitoring',
          description: 'Add application performance monitoring',
          implementation: 'Integrate with services like Sentry or DataDog'
        },
        {
          title: 'Add Comprehensive Logging',
          description: 'Log all integration activities with structured logging',
          implementation: 'Use consistent log format with timestamp, level, context'
        },
        {
          title: 'Create API Documentation',
          description: 'Document all API endpoints with OpenAPI/Swagger',
          implementation: 'Generate docs from code or write OpenAPI spec'
        }
      ]
    });

    // Determine overall health
    if (diagnostics.errors.length > 0) {
      diagnostics.overall_health = 'poor';
    } else if (diagnostics.warnings.length > 5) {
      diagnostics.overall_health = 'fair';
    } else if (diagnostics.warnings.length > 0) {
      diagnostics.overall_health = 'good';
    } else {
      diagnostics.overall_health = 'excellent';
    }

    return Response.json({
      success: true,
      diagnostics
    }, { status: 200 });
  } catch (error) {
    console.error('Diagnostics error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});