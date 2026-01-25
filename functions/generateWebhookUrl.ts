import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { v4 as uuid } from 'npm:uuid@9.0.0';

/**
 * Generate webhook URL and API key for a bot
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await req.json();

    if (!botId) {
      return Response.json({ error: 'Missing botId' }, { status: 400 });
    }

    // Fetch bot
    const bot = await base44.entities.Automation.get(botId);
    if (!bot) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Check if bot has webhook trigger
    if (bot.trigger?.type !== 'webhook' && bot.trigger?.type !== 'api_endpoint') {
      return Response.json(
        { error: 'This bot does not have a webhook trigger' },
        { status: 400 }
      );
    }

    // Generate API key if auth is required
    let apiKey = null;
    if (bot.trigger?.config?.requireApiKey) {
      apiKey = uuid();
      
      // Store API key (hashed in production)
      await base44.entities.Automation.update(botId, {
        trigger: {
          ...bot.trigger,
          config: {
            ...bot.trigger.config,
            apiKey
          }
        }
      });
    }

    // Generate webhook URL
    const baseUrl = Deno.env.get('BASE44_API_URL') || 'https://api.base44.io';
    const webhookUrl = `${baseUrl}/webhooks/trigger?bot_id=${botId}`;

    return Response.json({
      success: true,
      botId,
      botName: bot.name,
      webhookUrl,
      apiKey,
      requiresAuth: bot.trigger?.config?.requireApiKey || false,
      testCommand: generateTestCommand(webhookUrl, apiKey),
      documentation: {
        method: 'POST',
        headers: apiKey ? { 'x-api-key': apiKey } : {},
        bodyExample: {
          data: 'your_payload_data'
        }
      }
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Generate a curl command for testing
 */
function generateTestCommand(webhookUrl, apiKey) {
  if (apiKey) {
    return `curl -X POST "${webhookUrl}" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"test": "data"}'`;
  } else {
    return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"test": "data"}'`;
  }
}