import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { time_range } = await req.json();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (time_range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch all relevant data
    const [integrations, templates, webhookLogs, purchases] = await Promise.all([
      base44.entities.ExternalBotIntegration.list(),
      base44.entities.BotTemplate.list(),
      base44.entities.WebhookLog.list('-created_date', 1000),
      base44.entities.TemplatePurchase.list('-created_date', 500)
    ]);

    // Filter by date range
    const logsInRange = webhookLogs.filter(l => new Date(l.created_date) >= startDate);
    const purchasesInRange = purchases.filter(p => new Date(p.created_date) >= startDate);

    // Calculate metrics
    const totalExecutions = logsInRange.length;
    const successfulExecutions = logsInRange.filter(l => l.status === 'success').length;
    const failedExecutions = logsInRange.filter(l => l.status === 'failed').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(1) : 0;
    const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions * 100).toFixed(1) : 0;
    
    const avgResponseTime = totalExecutions > 0 
      ? Math.round(logsInRange.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalExecutions)
      : 0;

    const activeIntegrations = integrations.filter(i => i.is_active).length;
    const totalRevenue = purchasesInRange.reduce((sum, p) => sum + (p.price_paid || 0), 0);

    // Integration performance
    const integrationPerformance = integrations.map(int => {
      const intLogs = logsInRange.filter(l => l.integration_id === int.id);
      return {
        id: int.id,
        name: int.name,
        totalCalls: intLogs.length,
        successRate: intLogs.length > 0 
          ? (intLogs.filter(l => l.status === 'success').length / intLogs.length * 100).toFixed(1)
          : 0,
        avgResponseTime: intLogs.length > 0
          ? Math.round(intLogs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / intLogs.length)
          : 0
      };
    }).sort((a, b) => b.totalCalls - a.totalCalls);

    // Error breakdown
    const errorBreakdown = logsInRange
      .filter(l => l.status === 'failed')
      .reduce((acc, log) => {
        const errorType = log.error_message?.split(':')[0] || 'Unknown';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {});

    return Response.json({
      success: true,
      overview: {
        totalExecutions,
        successRate: parseFloat(successRate),
        errorRate: parseFloat(errorRate),
        avgResponseTime,
        activeIntegrations,
        totalTemplates: templates.length,
        totalRevenue
      },
      integrationPerformance,
      errorBreakdown,
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Aggregate analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});