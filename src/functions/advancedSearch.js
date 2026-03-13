import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
const MAX_LIST = 200;
const normalizeDoc = (item, type) => {
    const name = item.name ||
        item.title ||
        item.label ||
        item.slug ||
        item.id ||
        '';
    const description = item.description ||
        item.summary ||
        item.notes ||
        item.details ||
        '';
    const project = item.project_id ||
        item.projectId ||
        item.project ||
        item.parent_project_id ||
        '';
    const updatedAt = item.updated_at ||
        item.updated_date ||
        item.updatedAt ||
        item.created_at ||
        item.created_date ||
        item.createdAt ||
        '';
    const tags = Array.isArray(item.tags)
        ? item.tags
        : Array.isArray(item.tag_list)
            ? item.tag_list
            : Array.isArray(item.categories)
                ? item.categories
                : [];
    return {
        id: item.id,
        type,
        name,
        title: name,
        description,
        project,
        tags,
        updatedAt
    };
};
const scoreDoc = (doc, query) => {
    if (!query)
        return 0;
    const q = query.toLowerCase();
    const name = String(doc.name || '').toLowerCase();
    const description = String(doc.description || '').toLowerCase();
    const tags = (doc.tags || []).map((t) => String(t).toLowerCase());
    let score = 0;
    if (name === q)
        score += 100;
    if (name.includes(q))
        score += 70;
    if (description.includes(q))
        score += 30;
    if (tags.some((tag) => tag.includes(q)))
        score += 20;
    // Token-based boost
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
        tokens.forEach((token) => {
            if (name.includes(token))
                score += 10;
            if (description.includes(token))
                score += 5;
        });
    }
    return score;
};
const matchesQuery = (doc, query) => {
    if (!query)
        return true;
    const q = query.toLowerCase();
    const name = String(doc.name || '').toLowerCase();
    const description = String(doc.description || '').toLowerCase();
    const tags = (doc.tags || []).map((t) => String(t).toLowerCase());
    return (name.includes(q) ||
        description.includes(q) ||
        tags.some((tag) => tag.includes(q)));
};
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json().catch(() => ({}));
        const action = String(payload.action || 'search');
        const query = String(payload.query || '').trim();
        const filters = payload.filters || {};
        const limit = Math.min(Number(payload.limit) || 50, 200);
        const safeList = async (entityName) => {
            const entity = base44.entities?.[entityName];
            if (!entity?.list)
                return [];
            try {
                return await entity.list('-updated_date', MAX_LIST);
            }
            catch {
                try {
                    return await entity.list('-updated_at', MAX_LIST);
                }
                catch {
                    try {
                        return await entity.list(undefined, MAX_LIST);
                    }
                    catch {
                        return [];
                    }
                }
            }
        };
        const [projects, pages, entities, components] = await Promise.all([
            safeList('Project'),
            safeList('Page'),
            safeList('Entity'),
            safeList('Component')
        ]);
        const docs = [
            ...projects.map((item) => normalizeDoc(item, 'project')),
            ...pages.map((item) => normalizeDoc(item, 'page')),
            ...entities.map((item) => normalizeDoc(item, 'entity')),
            ...components.map((item) => normalizeDoc(item, 'component'))
        ];
        if (action === 'getFacets') {
            const byProjectMap = new Map();
            const byTypeMap = new Map();
            docs.forEach((doc) => {
                if (doc.project) {
                    byProjectMap.set(doc.project, (byProjectMap.get(doc.project) || 0) + 1);
                }
                byTypeMap.set(doc.type, (byTypeMap.get(doc.type) || 0) + 1);
            });
            return Response.json({
                byProject: Array.from(byProjectMap.entries()).map(([value, count]) => ({ value, count })),
                byType: Array.from(byTypeMap.entries()).map(([value, count]) => ({ value, count })),
                functions: docs
            });
        }
        if (action === 'autocomplete') {
            const suggestions = docs
                .filter((doc) => matchesQuery(doc, query))
                .map((doc) => doc.name)
                .filter(Boolean);
            const unique = Array.from(new Set(suggestions)).slice(0, limit);
            return Response.json(unique);
        }
        // Default: search
        let filtered = docs.filter((doc) => matchesQuery(doc, query));
        if (filters.type) {
            filtered = filtered.filter((doc) => doc.type === filters.type);
        }
        if (filters.project) {
            filtered = filtered.filter((doc) => doc.project === filters.project);
        }
        const results = filtered
            .map((doc) => ({ ...doc, score: scoreDoc(doc, query) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return Response.json({ results, total: filtered.length });
    }
    catch (error) {
        return Response.json({ error: error.message || 'Search failed' }, { status: 500 });
    }
});
