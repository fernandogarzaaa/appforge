import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issues } = await req.json();

    if (!issues) {
      return Response.json({ error: 'Issues array required' }, { status: 400 });
    }

    const fixes = {
      applied: [],
      failed: [],
      summary: {}
    };

    // Fix automations with missing config
    const automations = await base44.entities.Automation.list();
    for (const issue of issues.filter(i => i.type === 'Automation Config Error')) {
      try {
        const automation = automations.find(a => a.name === issue.automation);
        if (automation && !automation.trigger_type) {
          await base44.entities.Automation.update(automation.id, {
            is_active: true,
            trigger_type: 'manual'
          });
          fixes.applied.push({
            type: 'Fixed automation config',
            entity: issue.automation,
            action: 'Set default trigger type and enabled status'
          });
        }
      } catch (e) {
        fixes.failed.push({
          type: 'Automation Config Fix Failed',
          entity: issue.automation,
          error: e.message
        });
      }
    }

    // Fix missing status flags
    for (const issue of issues.filter(i => i.type === 'Automation Status Issue')) {
      try {
        const automations_list = await base44.entities.Automation.list();
        const automation = automations_list.find(a => a.name === issue.automation);
        if (automation) {
          await base44.entities.Automation.update(automation.id, {
            is_active: automation.is_active !== undefined ? automation.is_active : true
          });
          fixes.applied.push({
            type: 'Fixed status flag',
            entity: issue.automation,
            action: 'Set is_active status'
          });
        }
      } catch (e) {
        fixes.failed.push({
          type: 'Status Flag Fix Failed',
          entity: issue.automation,
          error: e.message
        });
      }
    }

    // Log audit activity
    try {
      await base44.entities.BotActivityLog.create({
        bot_id: 'project_auditor',
        action: 'automated_fixes_applied',
        performed_by: user.email,
        description: `Applied ${fixes.applied.length} automatic fixes`,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log activity:', e);
    }

    fixes.summary = {
      total_fixed: fixes.applied.length,
      total_failed: fixes.failed.length,
      timestamp: new Date().toISOString()
    };

    return Response.json({
      success: true,
      fixes
    });
  } catch (error) {
    console.error('Auto-fix error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});