import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { action_type, resource_type, resource_id, description, changes, severity = 'low', compliance_relevant = false } = body;

    const user = await base44.auth.me();
    
    const auditEntry = {
      action_type,
      resource_type,
      resource_id,
      performed_by: user?.email || 'system',
      description,
      changes,
      severity,
      timestamp: new Date().toISOString(),
      compliance_relevant,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    };

    await base44.asServiceRole.entities.AuditLog.create(auditEntry);

    return Response.json({ success: true, logged: auditEntry });
  } catch (error) {
    console.error('Audit logging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});