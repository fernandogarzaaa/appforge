import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Handle email triggers for bots
 * This would be called by email integration
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { emailAddress, subject, from, body, attachments = [] } = await req.json();

    if (!emailAddress || !body) {
      return Response.json({ error: 'Missing email data' }, { status: 400 });
    }

    // Find bots configured for this email address
    const bots = await base44.asServiceRole.entities.Automation.filter({
      trigger_type: 'email'
    });

    const matchingBots = bots.filter(bot => {
      const config = bot.trigger?.config || {};
      
      // Check email address
      if (config.emailAddress !== emailAddress) return false;
      
      // Check trigger type
      const triggerType = config.trigger || 'received';
      if (triggerType === 'subject_contains') {
        const keywords = (config.keywords || '').split(',').map(k => k.trim());
        if (!keywords.some(k => subject.includes(k))) return false;
      } else if (triggerType === 'from_address') {
        if (!from.includes(config.fromPattern)) return false;
      }
      
      return true;
    });

    const triggeredBots = [];

    for (const bot of matchingBots) {
      try {
        // Prepare trigger data
        const triggerData = {
          emailAddress,
          from,
          subject,
          body,
          attachmentCount: attachments.length,
          receivedAt: new Date().toISOString()
        };

        // Execute bot workflow
        const result = await base44.asServiceRole.functions.invoke('executeBotWorkflow', {
          botId: bot.id,
          triggerData
        });

        triggeredBots.push({
          botId: bot.id,
          botName: bot.name,
          success: result.success,
          executedNodes: result.nodesExecuted
        });

        // Create trigger log (check if entity exists)
        try {
          await base44.asServiceRole.entities.TriggerLog?.create?.({
          bot_id: bot.id,
          trigger_type: 'email',
          trigger_details: { from, subject },
          status: result.success ? 'success' : 'failed',
          logs: result.logs
          });
          } catch (logError) {
          console.error(`Failed to create trigger log: ${logError.message}`);
          }

      } catch (error) {
        console.error(`Failed to trigger bot ${bot.id}: ${error.message}`);
        triggeredBots.push({
          botId: bot.id,
          botName: bot.name,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      emailAddress,
      botsTriggered: triggeredBots.length,
      bots: triggeredBots
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});