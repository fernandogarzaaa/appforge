import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [errorLogs, auditLogs] = await Promise.all([
      base44.asServiceRole.entities.ErrorLog.filter({ resolved: false }),
      base44.asServiceRole.entities.AuditLog.list('-timestamp', 50)
    ]);

    const health = {
      status: 'operational',
      api_services: 'operational',
      database: 'operational',
      ai_services: 'operational',
      storage: 'operational',
      critical_errors: errorLogs.filter(e => e.severity === 'critical').length,
      warning_errors: errorLogs.filter(e => e.severity === 'high').length,
      recent_audit_logs: auditLogs.length,
      timestamp: new Date().toISOString()
    };

    if (health.critical_errors > 0) {
      health.status = 'degraded';
    }

    return Response.json(health);

  } catch (error) {
    console.error('System health check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});