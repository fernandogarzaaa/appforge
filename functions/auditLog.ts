import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action_type, resource_type, description, severity = 'medium', compliance_relevant = false } = await req.json();

    if (!action_type || !resource_type) {
      return Response.json({ error: 'action_type and resource_type required' }, { status: 400 });
    }

    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      action_type,
      resource_type,
      description: description || '',
      performed_by: user.email,
      severity,
      compliance_relevant,
      timestamp: new Date().toISOString()
    });

    return Response.json(auditLog);

  } catch (error) {
    console.error('AuditLog error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});