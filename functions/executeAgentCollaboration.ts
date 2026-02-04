import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId, triggerData } = await req.json();

    // Fetch collaboration workflow
    const workflows = await base44.asServiceRole.entities.AgentCollaboration.filter({ id: workflowId });
    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = workflows[0];
    let sharedContext = workflow.shared_context || {};
    const executionHistory = workflow.execution_history || [];
    let successCount = workflow.success_count || 0;
    let failureCount = workflow.failure_count || 0;

    // Execute workflow steps
    for (const step of workflow.workflow_steps) {
      const stepStartTime = Date.now();
      
      try {
        // Check if dependencies are met
        if (step.depends_on?.length > 0) {
          const dependenciesMet = step.depends_on.every(depId =>
            executionHistory.some(h => h.step_id === depId && h.status === 'success')
          );
          if (!dependenciesMet) continue;
        }

        // Fetch agent
        const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: step.agent_id });
        if (agents.length === 0) continue;

        const agent = agents[0];

        // Prepare input data with mapping
        const agentInput = step.data_mapping 
          ? Object.entries(step.data_mapping).reduce((acc, [key, path]) => {
              acc[key] = getNestedValue(sharedContext, path);
              return acc;
            }, {})
          : sharedContext;

        // Invoke agent with LLM
        const agentResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Agent: ${agent.agent_name}
Goal: ${agent.goal}
Input Data: ${JSON.stringify(agentInput)}

Execute this agent's goal with the provided input and return structured output.`,
          response_json_schema: {
            type: 'object',
            properties: {
              result: { type: 'string' },
              data: { type: 'object' },
              next_action: { type: 'string' }
            }
          }
        });

        const stepOutput = agentResponse.data || {};
        
        // Update shared context
        if (stepOutput.data) {
          sharedContext = { ...sharedContext, ...stepOutput.data };
        }

        // Record execution
        executionHistory.push({
          step_id: step.step_id,
          agent_id: step.agent_id,
          status: 'success',
          output: stepOutput,
          duration_ms: Date.now() - stepStartTime
        });

        successCount++;

      } catch (error) {
        executionHistory.push({
          step_id: step.step_id,
          agent_id: step.agent_id,
          status: 'failed',
          output: { error: error.message },
          duration_ms: Date.now() - stepStartTime
        });
        failureCount++;
      }
    }

    // Update workflow
    const updatedWorkflow = await base44.asServiceRole.entities.AgentCollaboration.update(workflowId, {
      execution_history: executionHistory,
      shared_context: sharedContext,
      success_count: successCount,
      failure_count: failureCount,
      status: failureCount === 0 ? 'completed' : 'failed'
    });

    return Response.json({
      workflowId,
      status: updatedWorkflow.status,
      successCount,
      failureCount,
      sharedContext,
      executionHistory: executionHistory.slice(-10) // Last 10 steps
    });

  } catch (error) {
    console.error('Collaboration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}