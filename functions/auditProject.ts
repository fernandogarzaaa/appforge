import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issues = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      summary: {}
    };

    // Audit entities for schema issues
    try {
      const entities = await base44.entities.Entity.list();
      for (const entity of entities) {
        if (!entity.name || !entity.properties) {
          issues.high.push({
            type: 'Entity Schema Error',
            entity: entity.name,
            description: 'Missing required schema properties',
            file: `entities/${entity.name}.json`
          });
        }
      }
    } catch (e) {
      console.error('Error auditing entities:', e);
    }

    // Audit automations for configuration issues
    try {
      const automations = await base44.entities.Automation.list();
      for (const automation of automations) {
        if (!automation.function_name || !automation.trigger_type) {
          issues.high.push({
            type: 'Automation Config Error',
            automation: automation.name,
            description: 'Missing trigger type or function reference',
            severity: 'high'
          });
        }
        if (automation.is_active === undefined) {
          issues.medium.push({
            type: 'Automation Status Issue',
            automation: automation.name,
            description: 'Status flag not explicitly set',
            severity: 'medium'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing automations:', e);
    }

    // Audit workflows
    try {
      const workflows = await base44.entities.Workflow.list();
      for (const workflow of workflows) {
        if (!workflow.name || !workflow.nodes) {
          issues.medium.push({
            type: 'Orphaned Workflow',
            workflow: workflow.id,
            description: 'Workflow missing essential configuration',
            severity: 'medium'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing workflows:', e);
    }

    // Audit chatbots
    try {
      const chatbots = await base44.entities.Chatbot.list();
      for (const chatbot of chatbots) {
        if (!chatbot.name || !chatbot.type) {
          issues.medium.push({
            type: 'Chatbot Config Error',
            chatbot: chatbot.name,
            description: 'Missing required chatbot configuration',
            severity: 'medium'
          });
        }
        if (!chatbot.is_active === undefined) {
          issues.low.push({
            type: 'Chatbot Status Issue',
            chatbot: chatbot.name,
            description: 'Chatbot status not explicitly set',
            severity: 'low'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing chatbots:', e);
    }

    // Audit pipelines
    try {
      const pipelines = await base44.entities.BotPipeline.list();
      for (const pipeline of pipelines) {
        if (!pipeline.bot_id || !pipeline.repository_url) {
          issues.high.push({
            type: 'Pipeline Config Error',
            pipeline: pipeline.name,
            description: 'Missing pipeline configuration',
            severity: 'high'
          });
        }
        if (!pipeline.stages || pipeline.stages.length === 0) {
          issues.medium.push({
            type: 'Pipeline Missing Stages',
            pipeline: pipeline.name,
            description: 'No pipeline stages configured',
            severity: 'medium'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing pipelines:', e);
    }

    // Audit integrations
    try {
      const integrations = await base44.entities.IntegrationConnection.list();
      for (const integration of integrations) {
        if (!integration.provider || !integration.status) {
          issues.medium.push({
            type: 'Integration Config Error',
            integration: integration.name,
            description: 'Missing integration configuration',
            severity: 'medium'
          });
        }
        if (integration.status === 'failed' || integration.status === 'error') {
          issues.high.push({
            type: 'Integration Connection Failed',
            integration: integration.name,
            description: `Integration status: ${integration.status}`,
            severity: 'high'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing integrations:', e);
    }

    // Audit alert configurations
    try {
      const alerts = await base44.entities.AlertConfiguration.list();
      for (const alert of alerts) {
        if (!alert.name || !alert.conditions) {
          issues.medium.push({
            type: 'Alert Config Error',
            alert: alert.name,
            description: 'Incomplete alert configuration',
            severity: 'medium'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing alerts:', e);
    }

    // Audit monitoring rules
    try {
      const rules = await base44.entities.MonitoringRule.list();
      for (const rule of rules) {
        if (!rule.name || !rule.data_source) {
          issues.medium.push({
            type: 'Monitoring Rule Error',
            rule: rule.name,
            description: 'Missing monitoring rule configuration',
            severity: 'medium'
          });
        }
      }
    } catch (e) {
      console.error('Error auditing monitoring rules:', e);
    }

    // Audit tasks for incomplete items
    try {
      const tasks = await base44.entities.Task.list();
      const incompleteTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
      if (incompleteTasks.length > 50) {
        issues.low.push({
          type: 'Task Backlog Warning',
          description: `${incompleteTasks.length} incomplete tasks in the system`,
          severity: 'low'
        });
      }
    } catch (e) {
      console.error('Error auditing tasks:', e);
    }

    // Check for missing critical functions
    const criticalFunctions = ['auditProject', 'reportAuditFindings', 'autoFixIssues'];
    // Note: Function availability would be checked via integration

    // Generate summary
    issues.summary = {
      total: issues.critical.length + issues.high.length + issues.medium.length + issues.low.length,
      critical_count: issues.critical.length,
      high_count: issues.high.length,
      medium_count: issues.medium.length,
      low_count: issues.low.length,
      timestamp: new Date().toISOString()
    };

    return Response.json({
      success: true,
      audit_report: issues,
      recommendations: generateRecommendations(issues)
    });
  } catch (error) {
    console.error('Project audit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateRecommendations(issues) {
  const recommendations = [];

  if (issues.critical.length > 0) {
    recommendations.push('🚨 CRITICAL: Fix all critical issues immediately before deployment');
  }

  if (issues.high.length > 0) {
    recommendations.push('⚠️ Address high-severity issues to prevent runtime errors');
  }

  if (issues.medium.length > 0) {
    recommendations.push('📌 Medium issues should be resolved to improve code quality');
  }

  if (issues.summary.total === 0) {
    recommendations.push('✅ Great! No issues detected in the project');
  }

  return recommendations;
}