import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test a bot workflow with sample data
 * Useful for debugging before deployment
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, testData = {} } = await req.json();

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
      return Response.json({
        success: false,
        botId,
        botName: bot.name,
        testResult: 'FAILED',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Execute workflow with test data
    const result = await base44.functions.invoke('executeBotWorkflow', {
      botId,
      triggerData: testData,
      isTest: true
    });

    return Response.json({
      success: result.success,
      botId,
      botName: bot.name,
      testResult: result.success ? 'PASSED' : 'FAILED',
      nodesExecuted: result.nodesExecuted,
      logs: result.logs,
      results: result.results,
      duration: result.duration,
      suggestions: validation.suggestions
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});