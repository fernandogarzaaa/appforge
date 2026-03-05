
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

type CycleResults = Record<string, unknown>;

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // Verify system/admin access (or just allow if it's a scheduled task)

        const results: CycleResults = {};

        console.log('🤖 Starting Autonomous Cycle...');

        // 1. Sentinel (Security)
        try {
            console.log('🛡️ Invoking Sentinel...');
            results.sentinel = await base44.functions.invoke('detectRealTimeErrors', {});
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            results.sentinel = { error: errorMsg };
        }

        // 2. Bug Hunter (QA)
        try {
            console.log('🐞 Invoking Bug Hunter...');
            results.bugHunter = await base44.functions.invoke('analyzeBugsProactively', {});
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            results.bugHunter = { error: errorMsg };
        }

        // 3. Optimizer (Performance)
        try {
            console.log('⚡ Invoking Optimizer...');
            // monitorResourceUsage is the existing function name
            results.optimizer = await base44.functions.invoke('monitorResourceUsage', {});
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            results.optimizer = { error: errorMsg };
        }

        // 4. God Mode (Developer)
        try {
            console.log('🧙‍♂️ Invoking God Mode...');
            results.godMode = await base44.functions.invoke('executeGodMode', {});
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            results.godMode = { error: errorMsg };
        }

        // Log the cycle completion
        await base44.entities.AuditLog.create({
            action_type: 'autonomous_cycle_complete',
            resource_type: 'function',
            performed_by: 'autonomous_bot',
            description: 'Completed full autonomous bot cycle',
            changes: results
        });

        return Response.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return Response.json({ error: errorMsg }, { status: 500 });
    }
});
