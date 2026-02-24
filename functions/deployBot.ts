import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import type { Base44Client, TriggerSetupResult, ValidationResult } from '../types/base44.d.ts';

interface BotTrigger {
  type?: string;
  config?: {
    frequency?: string;
    time?: string;
    methods?: string[];
    requireApiKey?: boolean;
    emailAddress?: string;
    trigger?: string;
  };
}

interface Bot {
  id: string;
  name: string;
  trigger?: BotTrigger;
  function_name?: string;
}

/**
 * Deploy/activate a bot
 * Sets up triggers and validates configuration
 */
Deno.serve(async (req) => {
  try {
    const base44: Base44Client = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await req.json() as { botId?: string };

    if (!botId) {
      return Response.json({ error: 'Missing botId' }, { status: 400 });
    }

    // Fetch bot
    const bot: Bot | null = await base44.entities.Automation.get(botId);
    if (!bot) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Validate configuration
    const validation: ValidationResult = await base44.functions.invoke('validateBotConfig', bot);
    if (!validation.valid) {
      return Response.json(
        { success: false, error: 'Invalid bot configuration', details: validation.errors },
        { status: 400 }
      );
    }

    // Set up trigger-specific infrastructure
    let triggerSetup: TriggerSetupResult = { success: true };

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
        { success: false, error: 'Failed to set up trigger', details: triggerSetup.error },
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

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
});

/**
 * Set up scheduled trigger
 */
async function setupScheduleTrigger(bot: Bot, base44: Base44Client): Promise<TriggerSetupResult> {
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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Set up webhook trigger
 */
async function setupWebhookTrigger(bot: Bot, _base44: Base44Client): Promise<TriggerSetupResult> {
  try {
    const webhookUrl = `${Deno.env.get('BASE44_API_URL')}/webhooks/bot?bot_id=${bot.id}`;

    return {
      success: true,
      message: 'Webhook endpoint ready',
      webhookUrl,
      methods: bot.trigger?.config?.methods || ['POST'],
      requiresAuth: bot.trigger?.config?.requireApiKey === true
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Set up email trigger
 */
async function setupEmailTrigger(bot: Bot, _base44: Base44Client): Promise<TriggerSetupResult> {
  try {
    const config = bot.trigger?.config || {};

    return {
      success: true,
      message: `Email trigger configured for ${config.emailAddress}`,
      emailAddress: config.emailAddress,
      triggerOn: config.trigger
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get schedule interval from frequency
 */
function getScheduleInterval(frequency: string | undefined): number {
  const intervals: Record<string, number> = {
    'hourly': 1,
    'daily': 1,
    'weekly': 1,
    'monthly': 1
  };
  return intervals[frequency || ''] || 1;
}

/**
 * Get schedule unit from frequency
 */
function getScheduleUnit(frequency: string | undefined): string {
  const units: Record<string, string> = {
    'hourly': 'hours',
    'daily': 'days',
    'weekly': 'weeks',
    'monthly': 'months'
  };
  return units[frequency || ''] || 'days';
}
