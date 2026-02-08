

Deno.serve(async (req) => {
    try {
        // Dynamic import to catch load errors
        let createClientFromRequest;
        try {
            const module = await import('npm:@base44/sdk@0.8.18');
            createClientFromRequest = module.createClientFromRequest;
        } catch (importError) {
            return Response.json({
                success: false,
                error: `SDK Import Failed: ${importError.message}`,
                stack: importError.stack
            }, { status: 200 });
        }

        const base44 = createClientFromRequest(req);
        // Verify system/admin access (or just allow if it's a scheduled task)

        const results: any = {};

        console.log('🤖 Starting Autonomous Cycle...');

        // 1. Sentinel (Security)
        try {
            console.log('🛡️ Invoking Sentinel...');
            results.sentinel = await base44.functions.invoke('detectRealTimeErrors', {});
        } catch (e) {
            results.sentinel = { error: e.message };
        }

        // 2. Bug Hunter (QA)
        try {
            console.log('🐞 Invoking Bug Hunter...');
            results.bugHunter = await base44.functions.invoke('analyzeBugsProactively', {});
        } catch (e) {
            results.bugHunter = { error: e.message };
        }

        // 3. Optimizer (Performance)
        try {
            console.log('⚡ Invoking Optimizer...');
            // monitorResourceUsage is the existing function name
            results.optimizer = await base44.functions.invoke('monitorResourceUsage', {});
        } catch (e) {
            results.optimizer = { error: e.message };
        }

        // 4. God Mode (Developer)
        try {
            console.log('🧙‍♂️ Invoking God Mode...');
            results.godMode = await base44.functions.invoke('executeGodMode', {});
        } catch (e) {
            results.godMode = { error: e.message };
        }

        // Log the cycle completion
        try {
            if (base44.entities.AuditLog) {
                await base44.entities.AuditLog.create({
                    action: 'autonomous_cycle_complete',
                    description: 'Completed full autonomous bot cycle',
                    changes: results
                });
            } else {
                results.auditLog = { warning: 'AuditLog entity not found in SDK' };
            }
        } catch (auditError) {
            results.auditLog = { error: auditError.message };
        }

        return Response.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        // Return 200 so the client receives the error details instead of a generic 500
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 200 });
    }
});
