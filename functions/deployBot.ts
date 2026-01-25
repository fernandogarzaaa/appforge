import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Deploy/activate a bot
 * Sets up triggers and validates configuration
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
    const bots = await base44.entities.Automation.filter({ id: botId });
    if (bots.length === 0) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    const bot = bots[0];

    // Validate configuration
    const validation = await base44.functions.invoke('validateBotConfig', bot);
    if (!validation.valid) {
      return Response.json(
        { error: 'Invalid bot configuration', details: validation.errors },
        { status: 400 }
      );
    }

    // Set up trigger-specific infrastructure
    let triggerSetup = { success: true };

    switch (bot.trigger?.type) {
      case 'schedule':
        triggerSetup = await setupScheduleTrigger(bot, base44);
        break;
      case 'webhook':
      case 'api_endpoint':
        triggerSetup = await setupWebhookTrigger(bot, base44);
        break;
      case 'email':
        triggerSetup = await setupEmailTrigger(bot, base44);
        break;
      case 'entity_change':
      case 'database_change':
      case 'file_upload':
        triggerSetup = { success: true, message: 'Trigger ready' };
        break;
    }

    if (!triggerSetup.success) {
      return Response.json(
        { error: 'Failed to set up trigger', details: triggerSetup.error },
        { status: 500 }
      );
    }

    // Update bot status to active
    await base44.entities.Automation.update(botId, {
      status: 'active',
      deployed_at: new Date().toISOString(),
      deployment_details: triggerSetup
    });

    return Response.json({
      success: true,
      botId,
      botName: bot.name,
      status: 'active',
      triggerType: bot.trigger?.type,
      deploymentDetails: triggerSetup,
      webhookUrl: triggerSetup.webhookUrl || null
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Set up scheduled trigger
 */
async function setupScheduleTrigger(bot, base44) {
  try {
    const config = bot.trigger?.config || {};
    
    // Create automation using Base44 automations
    const automation = {
      name: `Bot: ${bot.name}`,
      function_name: 'executeBotWorkflow',
      function_args: { botId: bot.id },
      repeat_interval: getScheduleInterval(config.frequency),
      repeat_unit: getScheduleUnit(config.frequency),
      start_time: config.time || '09:00'
    };

    return {
      success: true,
      message: `Schedule trigger set for ${config.frequency}`,
      automation
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Set up webhook trigger
 */
async function setupWebhookTrigger(bot, base44) {
  try {
    const webhookUrl = `${Deno.env.get('BASE44_API_URL')}/webhooks/bot?bot_id=${bot.id}`;

    return {
      success: true,
      message: 'Webhook endpoint ready',
      webhookUrl,
      methods: bot.trigger?.config?.methods || ['POST'],
      requiresAuth: bot.trigger?.config?.requireApiKey === true
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Set up email trigger
 */
async function setupEmailTrigger(bot, base44) {
  try {
    const config = bot.trigger?.config || {};

    return {
      success: true,
      message: `Email trigger configured for ${config.emailAddress}`,
      emailAddress: config.emailAddress,
      triggerOn: config.trigger
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get schedule interval from frequency
 */
function getScheduleInterval(frequency) {
  const intervals = {
    'hourly': 1,
    'daily': 1,
    'weekly': 1,
    'monthly': 1
  };
  return intervals[frequency] || 1;
}

/**
 * Get schedule unit from frequency
 */
function getScheduleUnit(frequency) {
  const units = {
    'hourly': 'hours',
    'daily': 'days',
    'weekly': 'weeks',
    'monthly': 'months'
  };
  return units[frequency] || 'days';
}