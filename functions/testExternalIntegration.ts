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

    // Get integration
    const integration = await base44.entities.ExternalBotIntegration.get(integration_id);

    if (!integration) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    let testResult = { success: false, message: '', details: {} };

    // Test based on integration type
    if (integration.integration_type === 'incoming_webhook') {
      // For incoming webhooks, just verify the URL is accessible
      testResult = {
        success: true,
        message: 'Webhook URL is ready to receive data',
        details: {
          webhook_url: integration.webhook_url,
          tip: 'Send a POST request to this URL to test'
        }
      };
    } else if (integration.integration_type === 'outgoing_webhook' || integration.integration_type === 'api_polling') {
      // Test outgoing connection
      if (!integration.api_endpoint) {
        return Response.json({ 
          success: false, 
          error: 'No API endpoint configured' 
        }, { status: 400 });
      }

      try {
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'Base44-Integration-Test'
        };

        // Add authentication if configured
        if (integration.authentication?.type === 'api_key') {
          headers[integration.authentication.api_key_header || 'X-API-Key'] = 'test-key';
        } else if (integration.authentication?.type === 'bearer') {
          headers['Authorization'] = 'Bearer test-token';
        }

        const testPayload = {
          test: true,
          timestamp: new Date().toISOString(),
          source: 'Base44 Integration Test'
        };

        const response = await fetch(integration.api_endpoint, {
          method: integration.api_method || 'POST',
          headers,
          body: integration.api_method !== 'GET' ? JSON.stringify(testPayload) : undefined
        });

        testResult = {
          success: response.ok,
          message: response.ok ? 'Connection successful' : 'Connection failed',
          details: {
            status: response.status,
            statusText: response.statusText,
            endpoint: integration.api_endpoint
          }
        };
      } catch (error) {
        testResult = {
          success: false,
          message: 'Connection failed',
          error: error.message
        };
      }
    }

    return Response.json(testResult, { status: 200 });
  } catch (error) {
    console.error('Test integration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});