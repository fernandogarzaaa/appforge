import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json().catch(() => ({}));
        const { action, key, value, ttl = 3600, pattern = '*', scope = 'user' } = payload || {};
        if (!action) {
            return Response.json({ error: 'Missing action' }, { status: 400 });
        }
        const cacheEntity = base44.asServiceRole.entities.CacheEntry;
        const now = new Date();
        const scopeFilter = scope === 'global'
            ? { scope: 'global' }
            : { scope: 'user', user_id: user.email };
        if (action === 'get') {
            if (!key) {
                return Response.json({ error: 'Missing key' }, { status: 400 });
            }
            const entries = await cacheEntity.filter({ ...scopeFilter, key }, '-updated_date', 1);
            const entry = entries?.[0];
            if (!entry) {
                return Response.json({ hit: false, value: null });
            }
            if (entry.expires_at && new Date(entry.expires_at) <= now) {
                await cacheEntity.delete(entry.id);
                return Response.json({ hit: false, value: null, expired: true });
            }
            return Response.json({ hit: true, value: entry.value, expires_at: entry.expires_at || null });
        }
        if (action === 'set') {
            if (!key) {
                return Response.json({ error: 'Missing key' }, { status: 400 });
            }
            const expiresAt = ttl ? new Date(Date.now() + Number(ttl) * 1000).toISOString() : null;
            const entries = await cacheEntity.filter({ ...scopeFilter, key }, '-updated_date', 1);
            const existing = entries?.[0];
            if (existing) {
                const updated = await cacheEntity.update(existing.id, {
                    value,
                    expires_at: expiresAt,
                    updated_at: new Date().toISOString()
                });
                return Response.json({ success: true, id: existing.id, entry: updated });
            }
            const created = await cacheEntity.create({
                key,
                value,
                scope: scopeFilter.scope,
                user_id: scopeFilter.user_id || null,
                expires_at: expiresAt,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            return Response.json({ success: true, id: created.id, entry: created });
        }
        if (action === 'invalidate') {
            const entries = await cacheEntity.filter(scopeFilter, '-updated_date', 500);
            const toDelete = (entries || []).filter((entry) => {
                if (pattern === '*')
                    return true;
                return String(entry.key || '').includes(pattern);
            });
            let deleted = 0;
            for (const entry of toDelete) {
                await cacheEntity.delete(entry.id);
                deleted++;
            }
            return Response.json({ success: true, deleted });
        }
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    catch (error) {
        return Response.json({ error: error.message || 'Cache operation failed' }, { status: 500 });
    }
});
