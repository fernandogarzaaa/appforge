import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_id, limit = 50 } = await req.json();

    if (!integration_id) {
      return Response.json({ error: 'Integration ID required' }, { status: 400 });
    }

    // Mock logs for now - in production, these would come from a logging system
    const logs = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'success',
        action: 'Webhook received',
        message: 'Successfully processed incoming data'
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'success',
        action: 'Data synced',
        message: '5 records created'
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'error',
        action: 'Sync failed',
        message: 'Target entity not found'
      }
    ];

    return Response.json({
      logs: logs.slice(0, limit),
      total: logs.length
    }, { status: 200 });
  } catch (error) {
    console.error('Get logs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});