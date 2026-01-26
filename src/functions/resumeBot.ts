import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Resume a paused bot
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
    let bot;
    try {
      bot = await base44.entities.Automation.get(botId);
    } catch {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (!bot) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Update status to active
    await base44.entities.Automation.update(botId, {
      status: 'active',
      resumed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      botId,
      botName: bot.name,
      status: 'active',
      message: 'Bot resumed successfully'
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});