import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Get bot execution history and logs
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const botId = url.searchParams.get('bot_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!botId) {
      return Response.json({ error: 'Missing bot_id parameter' }, { status: 400 });
    }

    // Fetch bot
    const bot = await base44.entities.Automation.get(botId);
    if (!bot) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Fetch execution history
    const executions = await base44.entities.WorkflowExecution.filter(
      { bot_id: botId },
      '-created_date',
      limit
    );

    // Calculate statistics
    const stats = calculateExecutionStats(executions);

    // Fetch webhook executions if applicable
    let webhookExecutions = [];
    if (bot.trigger?.type === 'webhook' || bot.trigger?.type === 'api_endpoint') {
      webhookExecutions = await base44.entities.WebhookExecution.filter(
        { bot_id: botId },
        '-created_date',
        10
      );
    }

    return Response.json({
      success: true,
      botId,
      botName: bot.name,
      stats,
      executions: executions.map(e => ({
        id: e.id,
        status: e.status,
        executedAt: e.created_date,
        duration: e.execution_time_ms,
        nodesExecuted: e.results?.length || 0,
        errorMessage: e.status === 'failed' ? e.logs?.[0]?.message : null
      })),
      webhookExecutions: webhookExecutions.map(w => ({
        id: w.id,
        status: w.status,
        receivedAt: w.received_at,
        executedAt: w.executed_at,
        payloadSize: JSON.stringify(w.payload).length
      }))
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Calculate execution statistics
 */
function calculateExecutionStats(executions) {
  if (executions.length === 0) {
    return {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      averageDuration: 0
    };
  }

  const successful = executions.filter(e => e.status === 'completed').length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const avgDuration = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / executions.length;

  return {
    totalExecutions: executions.length,
    successCount: successful,
    failureCount: failed,
    successRate: Math.round((successful / executions.length) * 100),
    averageDuration: Math.round(avgDuration),
    lastExecution: executions[0]?.created_date
  };
}