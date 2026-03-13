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
        const logs = await base44.entities.WebhookLog.filter({ integration_id }, '-created_date', limit);
        return Response.json({
            logs,
            total: logs.length
        }, { status: 200 });
    }
    catch (error) {
        console.error('Get logs error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
