import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collaborationId } = await req.json();

    // Fetch collaboration workflow
    const workflows = await base44.asServiceRole.entities.AgentCollaboration.filter({ 
      id: collaborationId 
    });
    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = workflows[0];
    const executionHistory = workflow.execution_history || [];
    const successCount = workflow.success_count || 0;
    const totalCount = successCount + (workflow.failure_count || 0);

    if (totalCount === 0) {
      return Response.json({ success: false, reason: 'No execution history' });
    }

    const successRate = successCount / totalCount;

    // Extract patterns from successful executions
    const successfulSteps = executionHistory.filter(e => e.status === 'success');
    const patterns = [];

    // Pattern 1: Data flow patterns
    if (workflow.shared_context && Object.keys(workflow.shared_context).length > 0) {
      patterns.push({
        type: 'data_flow',
        pattern: {
          inputs: Object.keys(workflow.shared_context),
          complexity: Object.keys(workflow.shared_context).length
        }
      });
    }

    // Pattern 2: Execution sequencing
    if (workflow.workflow_steps?.length > 0) {
      const sequencePattern = workflow.workflow_steps.map(s => s.agent_id);
      patterns.push({
        type: 'sequencing',
        pattern: { sequence: sequencePattern }
      });
    }

    // Pattern 3: Parameter tuning opportunities
    if (successfulSteps.length > 0) {
      const avgDuration = successfulSteps.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / successfulSteps.length;
      patterns.push({
        type: 'parameter_adjustment',
        pattern: { optimal_duration_ms: avgDuration, step_count: successfulSteps.length }
      });
    }

    // Pattern 4: Error recovery
    const failedSteps = executionHistory.filter(e => e.status === 'failed');
    if (failedSteps.length > 0 && successfulSteps.length > 0) {
      patterns.push({
        type: 'error_recovery',
        pattern: {
          recovery_success_rate: successRate,
          common_failures: failedSteps.slice(0, 3).map(s => s.step_id)
        }
      });
    }

    // Learn for each agent in the workflow
    const learnings = [];
    for (const agentId of workflow.agent_ids) {
      for (const pattern of patterns) {
        const learning = await base44.asServiceRole.entities.CollaborationLearning.create({
          agent_id: agentId,
          collaboration_id: collaborationId,
          pattern_type: pattern.type,
          pattern_data: pattern.pattern,
          success_rate: successRate,
          confidence: Math.min(1, successRate * (1 + (executionHistory.length / 50)))
        });
        learnings.push(learning);
      }
    }

    return Response.json({
      success: true,
      patternsLearned: patterns.length,
      agentsEnhanced: workflow.agent_ids.length,
      overallSuccessRate: (successRate * 100).toFixed(2),
      learnings: learnings.map(l => ({ type: l.pattern_type, confidence: l.confidence }))
    });

  } catch (error) {
    console.error('Collaboration learning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});