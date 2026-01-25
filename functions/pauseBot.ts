import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Pause a bot (disable triggers)
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

    // Update status to paused
    await base44.entities.Automation.update(botId, {
      status: 'paused',
      paused_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      botId,
      botName: bot.name,
      status: 'paused',
      message: 'Bot paused successfully'
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});