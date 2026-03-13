import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json().catch(() => ({}));
        const { plugin_id } = payload || {};
        if (!plugin_id) {
            return Response.json({ error: 'Missing plugin_id' }, { status: 400 });
        }
        const installs = await base44.asServiceRole.entities.PluginInstall.filter({ plugin_id }, '-created_date', 1000);
        const events = await base44.asServiceRole.entities.PluginEvent.filter({ plugin_id }, '-created_date', 1000);
        const now = Date.now();
        const last30Days = now - 30 * 24 * 60 * 60 * 1000;
        const activeUsers = new Set(events
            .filter((event) => {
            const created = new Date(event.created_at || event.created_date || 0).getTime();
            return created >= last30Days;
        })
            .map((event) => event.user_id));
        const executeEvents = events.filter((event) => event.event_type === 'execute');
        return Response.json({
            installs: installs.length,
            activeUsers: activeUsers.size,
            executions: executeEvents.length,
            lastExecution: executeEvents[0]?.created_at || null,
            reviews: 0,
            rating: null
        });
    }
    catch (error) {
        return Response.json({ error: error.message || 'Failed to load plugin stats' }, { status: 500 });
    }
});
