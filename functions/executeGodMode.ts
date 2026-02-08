


Deno.serve(async (req) => {
    try {
        // Dynamic import to catch load errors & generic fallback
        let createClientFromRequest;
        try {
            const module = await import('npm:@base44/sdk@0.8.18');
            createClientFromRequest = module.createClientFromRequest;
        } catch (e1) {
            console.warn('NPM import failed, trying ESM.sh...', e1.message);
            try {
                const module = await import('https://esm.sh/@base44/sdk@0.8.18');
                createClientFromRequest = module.createClientFromRequest;
            } catch (e2) {
                return Response.json({
                    success: false,
                    error: `Critical: SDK Import Failed. \nNPM: ${e1.message}\nCDN: ${e2.message}`,
                }, { status: 200 });
            }
        }

        const base44 = createClientFromRequest(req);

        console.log('📡 Emitting God Mode Signal...');

        // Create a 'Signal' record in AuditLog
        let signalResult;
        try {
            if (base44.entities.AuditLog) {
                signalResult = await base44.entities.AuditLog.create({
                    action: 'SWARM_SIGNAL',
                    description: 'Manual Trigger: God Mode',
                    changes: {
                        status: 'PENDING',
                        timestamp: new Date().toISOString(),
                        source: 'god_mode_manual_trigger'
                    }
                });
            } else {
                return Response.json({ success: false, error: 'AuditLog entity missing' }, { status: 200 });
            }
        } catch (auditError) {
            return Response.json({ success: false, error: `Signal Failed: ${auditError.message}` }, { status: 200 });
        }

        return Response.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'God Mode Signal sent to Local Swarm',
            signalId: signalResult?.id
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 200 });
    }
});

