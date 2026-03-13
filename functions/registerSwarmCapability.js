import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
const CAPABILITY_REGISTRY_PATH = new URL('../swarm/data/swarm_capability_registry.json', import.meta.url);
async function readRegistry() {
    try {
        const raw = await Deno.readTextFile(CAPABILITY_REGISTRY_PATH);
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
        const payload = await req.json();
        if (!payload.swarmId) {
            return Response.json({ error: 'swarmId is required' }, { status: 400 });
        }
        const registry = await readRegistry();
        registry[payload.swarmId] = {
            swarmId: payload.swarmId,
            authorityScope: payload.authorityScope || [],
            mutationBoundaries: payload.mutationBoundaries || [],
            requiredChecks: payload.requiredChecks || ['npm run lint', 'npm run typecheck', 'npm test'],
            owner: payload.owner || 'god_swarm',
            updatedAt: new Date().toISOString(),
            updatedBy: user.email || user.id
        };
        await Deno.writeTextFile(CAPABILITY_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
        return Response.json({
            success: true,
            swarmId: payload.swarmId,
            registrySize: Object.keys(registry).length
        });
    }
    catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
});
