import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { v4 as uuid } from 'npm:uuid@9.0.0';

/**
 * Webhook endpoint to trigger bots externally
 * Validates authentication and executes bot workflow
 */
Deno.serve(async (req) => {
  try {
    // Parse request
    const contentType = req.headers.get('content-type') || '';
    let payload = {};

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      for (const [key, value] of formData) {
        payload[key] = value;
      }
    }

    // Extract bot ID and API key from URL or headers
    const url = new URL(req.url);
    const botId = url.searchParams.get('bot_id');
    const apiKey = req.headers.get('x-api-key') || url.searchParams.get('api_key');

    if (!botId) {
      return Response.json({ error: 'Missing bot_id parameter' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Fetch bot configuration
    const bot = await base44.asServiceRole.entities.Automation.get(botId);
    if (!bot) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Validate trigger type
    if (bot.trigger?.type !== 'api_endpoint' && bot.trigger?.type !== 'webhook') {
      return Response.json(
        { error: 'This bot is not configured for webhook triggers' },
        { status: 403 }
      );
    }

    // Validate authentication if required
    if (bot.trigger?.config?.authType === 'api_key') {
      if (!apiKey || apiKey !== bot.trigger?.config?.apiKey) {
        return Response.json({ error: 'Invalid API key' }, { status: 401 });
      }
    }

    // Validate payload format
    if (bot.trigger?.config?.payloadSchema) {
      const validationResult = validatePayload(payload, bot.trigger.config.payloadSchema);
      if (!validationResult.valid) {
        return Response.json(
          { error: 'Invalid payload format', details: validationResult.errors },
          { status: 400 }
        );
      }
    }

    // Create webhook execution record
    const executionId = uuid();
    const webhookExecution = await base44.asServiceRole.entities.WebhookExecution.create({
      bot_id: botId,
      execution_id: executionId,
      payload: payload,
      status: 'pending',
      received_at: new Date().toISOString()
    });

    // Execute bot workflow asynchronously
    executeWorkflowAsync(botId, payload, executionId, base44);

    // Return webhook URL for reference
    return Response.json({
      success: true,
      message: 'Webhook received and queued for execution',
      executionId,
      botName: bot.name,
      webhookUrl: url.toString()
    }, { status: 202 });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Execute workflow asynchronously
 */
async function executeWorkflowAsync(botId, triggerData, executionId, base44) {
  try {
    const response = await base44.asServiceRole.functions.invoke('executeBotWorkflow', {
      botId,
      triggerData,
      executionId
    });

    // Update execution status
    await base44.asServiceRole.entities.WebhookExecution.update(executionId, {
      status: response.success ? 'completed' : 'failed',
      response: response,
      executed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Failed to execute workflow: ${error.message}`);
    
    // Update execution status to failed
    try {
      await base44.asServiceRole.entities.WebhookExecution.update(executionId, {
        status: 'failed',
        error: error.message,
        executed_at: new Date().toISOString()
      });
    } catch (updateError) {
      console.error(`Failed to update execution status: ${updateError.message}`);
    }
  }
}

/**
 * Validate webhook payload against schema
 */
function validatePayload(payload, schema) {
  const errors = [];

  try {
    const payloadSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;

    for (const [key, type] of Object.entries(payloadSchema)) {
      if (!(key in payload)) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      const expectedType = typeof payload[key];
      if (expectedType !== type) {
        errors.push(`Field '${key}' should be ${type}, got ${expectedType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Invalid schema format']
    };
  }
}