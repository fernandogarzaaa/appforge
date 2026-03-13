import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const subs = await base44.asServiceRole.entities.UserSubscription.list('-started_at', 500);
        return Response.json(subs);
    }
    catch (error) {
        return Response.json({ error: error.message || 'Failed to load subscribers' }, { status: 500 });
    }
});
