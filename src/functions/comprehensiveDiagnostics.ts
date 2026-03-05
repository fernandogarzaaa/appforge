import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

interface DiagnosticsState {
  timestamp: string;
  user: string;
  checks: Array<Record<string, unknown>>;
  issues: Array<Record<string, unknown>>;
  suggestions: Array<Record<string, unknown>>;
  stats: Record<string, any>;
  summary?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics: DiagnosticsState = {
      timestamp: new Date().toISOString(),
      user: user.email,
      checks: [],
      issues: [],
      suggestions: [],
      stats: {}
    };

    // Check entities
    try {
      const entities = [
        'Project', 'Conversation', 'ProjectDocument', 'BotTemplate', 
        'IntegrationTemplate', 'MobileApp', 'APIKey', 'WebhookLog',
        'AnalyticsMetric', 'Chatbot', 'ChatbotConversation', 'AIInsight',
        'Prediction', 'Workflow', 'WorkflowExecution', 'FeatureFlag'
      ];
      
      const entityStats = {};
      for (const entityName of entities) {
        try {
          const records = await base44.asServiceRole.entities[entityName].list();
          entityStats[entityName] = records.length;
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          diagnostics.issues.push({
            severity: 'warning',
            type: 'entity_access',
            entity: entityName,
            message: `Cannot access ${entityName}: ${errorMsg}`
          });
        }
      }
      
      diagnostics.stats.entities = entityStats;
      diagnostics.checks.push({ name: 'Entity Access', status: 'passed' });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      diagnostics.checks.push({ name: 'Entity Access', status: 'failed', error: errorMsg });
      diagnostics.issues.push({
        severity: 'critical',
        type: 'entity_system',
        message: 'Entity system check failed'
      });
    }

    // Check integrations
    try {
      const testLLM = await base44.integrations.Core.InvokeLLM({
        prompt: 'Say "OK" if working'
      });
      diagnostics.checks.push({ name: 'AI Integration', status: 'passed' });
      diagnostics.stats.aiWorking = true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      diagnostics.checks.push({ name: 'AI Integration', status: 'failed', error: errorMsg });
      diagnostics.issues.push({
        severity: 'critical',
        type: 'ai_integration',
        message: 'AI integration not working'
      });
    }

    // Check agents
    try {
      const agentNames = ['ai_assistant', 'project_auditor', 'functionValidator'];
      diagnostics.stats.agents = {};
      
      for (const agentName of agentNames) {
        try {
          const whatsappUrl = base44.agents.getWhatsAppConnectURL(agentName);
          diagnostics.stats.agents[agentName] = 'configured';
        } catch (e) {
          diagnostics.stats.agents[agentName] = 'missing';
          diagnostics.suggestions.push({
            type: 'agent_setup',
            message: `Agent '${agentName}' may need configuration`
          });
        }
      }
      diagnostics.checks.push({ name: 'Agents', status: 'passed' });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      diagnostics.checks.push({ name: 'Agents', status: 'failed', error: errorMsg });
    }

    // Feature suggestions based on data
    const projectCount = diagnostics.stats.entities?.Project || 0;
    const conversationCount = diagnostics.stats.entities?.Conversation || 0;
    const mobileAppCount = diagnostics.stats.entities?.MobileApp || 0;

    if (projectCount === 0) {
      diagnostics.suggestions.push({
        type: 'onboarding',
        priority: 'high',
        message: 'No projects created yet - guide users through first project creation'
      });
    }

    if (conversationCount > 10) {
      diagnostics.suggestions.push({
        type: 'feature',
        priority: 'medium',
        message: 'Add conversation search and tagging for better organization'
      });
    }

    if (mobileAppCount === 0) {
      diagnostics.suggestions.push({
        type: 'feature',
        priority: 'low',
        message: 'Promote mobile app builder feature to users'
      });
    }

    // Performance recommendations
    diagnostics.suggestions.push({
      type: 'performance',
      priority: 'medium',
      message: 'Consider adding conversation pagination for better performance'
    });

    diagnostics.suggestions.push({
      type: 'ux',
      priority: 'high',
      message: 'Add keyboard shortcuts (Cmd/Ctrl+K for command palette)'
    });

    diagnostics.suggestions.push({
      type: 'feature',
      priority: 'high',
      message: 'Add voice input for AI Assistant'
    });

    diagnostics.suggestions.push({
      type: 'feature',
      priority: 'medium',
      message: 'Add export conversation to PDF/Markdown'
    });

    diagnostics.suggestions.push({
      type: 'feature',
      priority: 'medium',
      message: 'Add AI-powered code snippet library'
    });

    // Summary
    const passedChecks = diagnostics.checks.filter(c => c.status === 'passed').length;
    const totalChecks = diagnostics.checks.length;
    const criticalIssues = diagnostics.issues.filter(i => i.severity === 'critical').length;

    diagnostics.summary = {
      health: criticalIssues === 0 ? (passedChecks === totalChecks ? 'excellent' : 'good') : 'needs attention',
      score: Math.round((passedChecks / totalChecks) * 100),
      passedChecks,
      totalChecks,
      criticalIssues,
      totalSuggestions: diagnostics.suggestions.length
    };

    return Response.json(diagnostics);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return Response.json({ 
      error: errorMsg,
      stack: errorStack 
    }, { status: 500 });
  }
});