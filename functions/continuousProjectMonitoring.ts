import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import type { Base44Client, Base44User, MonitoringMetrics, CriticalIssue } from '@base44/sdk';

interface WarningItem {
  type: string;
  area: string;
  issue: string;
  id: string;
}

Deno.serve(async (req) => {
  try {
    const base44: Base44Client = createClientFromRequest(req);
    const user: Base44User | null = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();
    const criticalIssues: CriticalIssue[] = [];
    const warnings: (WarningItem | string)[] = [];
    const metrics: MonitoringMetrics = {};

    // Monitor automations
    try {
      const automations = await base44.entities.Automation.list();
      metrics.total_automations = automations.length;
      metrics.active_automations = automations.filter((a: { is_active?: boolean }) => a.is_active).length;
      
      for (const automation of automations) {
        if (automation.is_active && !automation.function_name) {
          criticalIssues.push({
            type: 'CRITICAL',
            area: 'Automation',
            issue: `Automation "${automation.name}" is active but has no function assigned`,
            id: automation.id,
            auto_fixable: true
          });
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      warnings.push(`Failed to monitor automations: ${errorMsg}`);
    }

    // Monitor workflows
    try {
      const workflows = await base44.entities.Workflow.list();
      metrics.total_workflows = workflows.length;
      
      for (const workflow of workflows) {
        if (!workflow.nodes || workflow.nodes.length === 0) {
          warnings.push({
            type: 'WARNING',
            area: 'Workflow',
            issue: `Workflow "${workflow.name}" has no nodes configured`,
            id: workflow.id
          });
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      warnings.push(`Failed to monitor workflows: ${errorMsg}`);
    }

    // Monitor integrations
    try {
      const integrations = await base44.entities.IntegrationConnection.list();
      metrics.total_integrations = integrations.length;
      metrics.healthy_integrations = integrations.filter((i: { status?: string }) => i.status === 'connected').length;
      
      for (const integration of integrations) {
        if (integration.status === 'failed' || integration.status === 'error') {
          criticalIssues.push({
            type: 'CRITICAL',
            area: 'Integration',
            issue: `Integration "${integration.name}" is ${integration.status}`,
            id: integration.id,
            provider: integration.provider,
            auto_fixable: false
          });
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      warnings.push(`Failed to monitor integrations: ${errorMsg}`);
    }

    // Monitor pipelines
    try {
      const pipelines = await base44.entities.BotPipeline.list();
      metrics.total_pipelines = pipelines.length;
      
      for (const pipeline of pipelines) {
        if (pipeline.is_active && (!pipeline.stages || pipeline.stages.length === 0)) {
          criticalIssues.push({
            type: 'HIGH',
            area: 'Pipeline',
            issue: `Pipeline "${pipeline.name}" is active but has no stages`,
            id: pipeline.id,
            auto_fixable: true
          });
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      warnings.push(`Failed to monitor pipelines: ${errorMsg}`);
    }

    // Monitor deployment configs
    try {
      const deployments = await base44.entities.DeploymentConfig.list();
      metrics.total_deployments = deployments.length;
      
      for (const deployment of deployments) {
        if (deployment.last_deployment_status === 'failed') {
          warnings.push({
            type: 'WARNING',
            area: 'Deployment',
            issue: `Last deployment of "${deployment.name}" failed`,
            id: deployment.id
          });
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      warnings.push(`Failed to monitor deployments: ${errorMsg}`);
    }

    // Log health status
    await base44.entities.SystemHealthMetric.create({
      metric_type: 'alert_volume',
      timestamp,
      alert_count: criticalIssues.length,
      alert_trend: criticalIssues.length > 5 ? 'increasing' : 'stable'
    });

    // Create audit log
    await base44.entities.AuditLog.create({
      action: 'continuous_monitoring_cycle',
      performed_by: user.email,
      description: `Continuous monitoring cycle completed. Critical issues: ${criticalIssues.length}`,
      changes: {
        critical_issues: criticalIssues.length,
        warnings: warnings.length,
        metrics
      }
    });

    return Response.json({
      success: true,
      timestamp,
      critical_issues: criticalIssues,
      warnings,
      metrics,
      monitoring_complete: true
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: errorMsg }, { status: 500 });
  }
});
