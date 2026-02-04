import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, sourceType, sourceReferenceId } = await req.json();

    // Fetch agent
    const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];
    let workflow = null;

    if (sourceType === 'successful_collaboration') {
      // Learn from collaboration patterns
      const collabs = await base44.asServiceRole.entities.AgentCollaboration.filter({
        id: sourceReferenceId
      });

      if (collabs.length === 0) {
        return Response.json({ error: 'Collaboration not found' }, { status: 404 });
      }

      const collab = collabs[0];
      const steps = [];

      // Extract steps from collaboration
      if (collab.workflow_steps && collab.workflow_steps.length > 0) {
        collab.workflow_steps.forEach((step, idx) => {
          steps.push({
            step_num: idx + 1,
            title: `Learn Pattern: ${step.action || 'Step ' + (idx + 1)}`,
            description: `Study how agent in position ${idx + 1} executed: ${step.action}`,
            action_type: 'study_pattern',
            parameters: {
              target_agent: step.agent_id,
              pattern_action: step.action,
              duration_target_ms: 1000
            }
          });
        });
      }

      workflow = {
        workflow_name: `Learn from Collaboration Success`,
        description: `Guided workflow to learn successful patterns from collaboration execution with ${collab.success_count} successes`,
        source_type: 'successful_collaboration',
        source_reference_id: sourceReferenceId,
        steps,
        difficulty_level: 'intermediate',
        estimated_duration_minutes: Math.min(60, steps.length * 5),
        predicted_improvement: Math.min(25, collab.success_count * 3)
      };
    } else if (sourceType === 'high_performing_agent') {
      // Learn from high-performing agent
      const refAgents = await base44.asServiceRole.entities.CustomAgent.filter({
        id: sourceReferenceId
      });

      if (refAgents.length === 0) {
        return Response.json({ error: 'Reference agent not found' }, { status: 404 });
      }

      const refAgent = refAgents[0];
      const refMetrics = refAgent.performance_metrics || {};
      const steps = [];

      // Create steps to mimic high performer
      if (refAgent.parameters) {
        steps.push({
          step_num: 1,
          title: 'Adopt Successful Parameters',
          description: `Apply ${refAgent.agent_name}'s proven parameters`,
          action_type: 'apply_parameters',
          parameters: refAgent.parameters
        });
      }

      if (refAgent.training_data && refAgent.training_data.length > 0) {
        steps.push({
          step_num: 2,
          title: 'Study Training Examples',
          description: `Review ${refAgent.training_data.length} successful training examples`,
          action_type: 'study_examples',
          parameters: { example_count: refAgent.training_data.length }
        });
      }

      steps.push({
        step_num: 3,
        title: 'Performance Verification',
        description: 'Run tests to verify matching performance',
        action_type: 'verify_performance',
        parameters: { target_accuracy: refMetrics.accuracy }
      });

      workflow = {
        workflow_name: `Learn from ${refAgent.agent_name}`,
        description: `Guided workflow to adopt best practices from high-performing agent with ${((refMetrics.accuracy || 0) * 100).toFixed(0)}% accuracy`,
        source_type: 'high_performing_agent',
        source_reference_id: sourceReferenceId,
        steps,
        difficulty_level: 'beginner',
        estimated_duration_minutes: 30,
        predicted_improvement: Math.min(30, ((refMetrics.accuracy || 0) - (agent.performance_metrics?.accuracy || 0)) * 100)
      };
    }

    if (!workflow) {
      return Response.json({ error: 'Invalid source type' }, { status: 400 });
    }

    // Create workflow
    const created = await base44.asServiceRole.entities.GuidedLearningWorkflow.create({
      agent_id: agentId,
      user_id: user.email,
      ...workflow
    });

    return Response.json({
      success: true,
      workflowId: created.id,
      workflowName: created.workflow_name,
      stepCount: created.steps.length,
      estimatedDuration: created.estimated_duration_minutes,
      predictedImprovement: created.predicted_improvement
    });

  } catch (error) {
    console.error('Workflow creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});