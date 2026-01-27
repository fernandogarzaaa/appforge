import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { errors, auto_apply = false } = await req.json();

    if (!Array.isArray(errors) || errors.length === 0) {
      return Response.json({ error: 'Errors array is required' }, { status: 400 });
    }

    const fixes = [];
    const failed = [];

    for (const error of errors) {
      try {
        let fixed = false;

        // Fix missing function references in automations
        if (error.type === 'RUNTIME_ERROR' && error.entity === 'Automation' && error.id) {
          if (auto_apply) {
            const automation = await base44.entities.Automation.list();
            const target = automation.find(a => a.id === error.id);
            if (target) {
              // Set a default function or mark for manual review
              await base44.entities.Automation.update(error.id, {
                is_active: false
              });
              fixes.push({
                error_id: error.id,
                action: 'Disabled automation pending manual configuration',
                entity: 'Automation',
                status: 'fixed'
              });
              fixed = true;
            }
          }
        }

        // Fix missing trigger types
        if (error.type === 'CONFIG_ERROR' && error.entity === 'Automation' && error.id) {
          if (auto_apply) {
            await base44.entities.Automation.update(error.id, {
              trigger_type: 'manual'
            });
            fixes.push({
              error_id: error.id,
              action: 'Set trigger type to manual',
              entity: 'Automation',
              status: 'fixed'
            });
            fixed = true;
          }
        }

        // Fix node type errors in workflows
        if (error.type === 'NODE_ERROR' && error.entity === 'Workflow' && error.id) {
          if (auto_apply) {
            const workflows = await base44.entities.Workflow.list();
            const workflow = workflows.find(w => w.id === error.id);
            if (workflow && workflow.nodes) {
              const updatedNodes = workflow.nodes.map(node => ({
                ...node,
                type: node.type || 'action'
              }));
              await base44.entities.Workflow.update(error.id, {
                nodes: updatedNodes
              });
              fixes.push({
                error_id: error.id,
                action: 'Fixed missing node types',
                entity: 'Workflow',
                status: 'fixed'
              });
              fixed = true;
            }
          }
        }

        if (!fixed) {
          fixes.push({
            error_id: error.id,
            action: 'Flagged for manual review',
            entity: error.entity,
            status: 'pending_review'
          });
        }
      } catch (e) {
        failed.push({
          error_id: error.id,
          reason: e.message
        });
      }
    }

    // Create ticket for critical unfixable errors
    const criticalErrors = errors.filter(e => e.severity === 'critical' && !fixes.find(f => f.status === 'fixed' && f.error_id === e.id));
    if (criticalErrors.length > 0) {
      await base44.entities.SupportTicket.create({
        title: `🔧 [AUTO] Critical Errors Requiring Manual Fix`,
        description: `${criticalErrors.length} critical errors detected and flagged for manual review:\n\n${criticalErrors.map(e => `- ${e.message}`).join('\n')}`,
        severity: 'critical',
        priority: 9,
        status: 'open',
        assigned_to: user.email,
        category: 'error_fix'
      });
    }

    // Log the fixes
    await base44.entities.AuditLog.create({
      action: 'auto_fix_errors_applied',
      performed_by: user.email,
      description: `Applied automatic fixes to ${fixes.filter(f => f.status === 'fixed').length} errors`,
      changes: {
        fixed_count: fixes.filter(f => f.status === 'fixed').length,
        pending_review: fixes.filter(f => f.status === 'pending_review').length,
        failed_count: failed.length,
        fixes
      }
    });

    return Response.json({
      success: true,
      fixed: fixes.filter(f => f.status === 'fixed').length,
      pending_review: fixes.filter(f => f.status === 'pending_review').length,
      failed: failed.length,
      fixes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});