import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const errors = [];
    const warnings = [];

    // Check automations for runtime errors
    try {
      const automations = await base44.entities.Automation.list();
      for (const automation of automations) {
        if (!automation.function_name && automation.is_active) {
          errors.push({
            type: 'RUNTIME_ERROR',
            severity: 'critical',
            entity: 'Automation',
            name: automation.name,
            id: automation.id,
            message: `Active automation missing function reference`,
            fixable: true,
            suggested_fix: 'Assign a valid function to this automation'
          });
        }
        if (automation.is_active && !automation.trigger_type) {
          errors.push({
            type: 'CONFIG_ERROR',
            severity: 'high',
            entity: 'Automation',
            name: automation.name,
            id: automation.id,
            message: 'Active automation has no trigger type defined',
            fixable: true
          });
        }
      }
    } catch (e) {
      warnings.push(`Error scanning automations: ${e.message}`);
    }

    // Check workflows for structural errors
    try {
      const workflows = await base44.entities.Workflow.list();
      for (const workflow of workflows) {
        if (!workflow.nodes || workflow.nodes.length === 0) {
          warnings.push({
            type: 'STRUCTURE_WARNING',
            entity: 'Workflow',
            name: workflow.name,
            id: workflow.id,
            message: 'Workflow has no nodes configured'
          });
        }
        if (workflow.nodes) {
          for (const node of workflow.nodes) {
            if (!node.type) {
              errors.push({
                type: 'NODE_ERROR',
                severity: 'high',
                entity: 'Workflow',
                name: workflow.name,
                id: workflow.id,
                message: `Node ${node.id} has no type defined`,
                fixable: true
              });
            }
          }
        }
      }
    } catch (e) {
      warnings.push(`Error scanning workflows: ${e.message}`);
    }

    // Check integration connections
    try {
      const integrations = await base44.entities.IntegrationConnection.list();
      for (const integration of integrations) {
        if (integration.status === 'error' || integration.status === 'failed') {
          errors.push({
            type: 'CONNECTION_ERROR',
            severity: 'critical',
            entity: 'Integration',
            name: integration.name,
            id: integration.id,
            provider: integration.provider,
            message: `${integration.name} connection is ${integration.status}`,
            fixable: false
          });
        }
      }
    } catch (e) {
      warnings.push(`Error scanning integrations: ${e.message}`);
    }

    // Check function deployments
    try {
      const auditLogs = await base44.entities.AuditLog.filter({ action: 'function_deployment_failed' }, '-created_date', 20);
      if (auditLogs.length > 0) {
        errors.push({
          type: 'DEPLOYMENT_ERROR',
          severity: 'high',
          entity: 'Function',
          message: `${auditLogs.length} function deployments failed recently`,
          fixable: true,
          details: auditLogs.slice(0, 5)
        });
      }
    } catch (e) {
      // Silent fail for audit logs
    }

    // Log the real-time error detection
    if (errors.length > 0 || warnings.length > 0) {
      await base44.entities.AuditLog.create({
        action: 'real_time_error_detection',
        performed_by: user.email,
        description: `Detected ${errors.length} errors and ${warnings.length} warnings in real-time monitoring`,
        changes: {
          errors_count: errors.length,
          warnings_count: warnings.length,
          critical_count: errors.filter(e => e.severity === 'critical').length
        }
      });
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      errors: errors.sort((a, b) => {
        const severityMap = { critical: 3, high: 2, medium: 1 };
        return (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0);
      }),
      warnings,
      total_issues: errors.length + warnings.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});