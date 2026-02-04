import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, feedbackScore, result, executionTimeMs } = await req.json();

    if (!agentId) {
      return Response.json({ error: 'Agent ID required' }, { status: 400 });
    }

    // Fetch current agent deployment
    const deployments = await base44.asServiceRole.entities.AgentDeployment.filter({
      id: agentId,
    });

    if (deployments.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = deployments[0];
    const currentParams = agent.parameters || {};
    const currentPerformance = agent.performance || {};

    // Use LLM to generate optimization strategy
    const optimizationAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimize these agent parameters based on user feedback:

Agent Type: ${agent.agent_type}
Current Parameters: ${JSON.stringify(currentParams)}
Feedback Score: ${feedbackScore} (0-1)
Execution Time: ${executionTimeMs}ms
Previous Iterations: ${currentPerformance.iterations || 0}

User feedback indicates ${feedbackScore > 0.7 ? 'good' : feedbackScore > 0.5 ? 'acceptable' : 'poor'} performance.

Provide optimized parameters as JSON: {
  "optimized_parameters": {
    "temperature": 0-1,
    "creativity": 0-1,
    "accuracy": 0-1,
    "speed": 0-1
  },
  "improvements": ["improvement 1", "improvement 2"],
  "confidence": 0-1
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          optimized_parameters: { type: 'object' },
          improvements: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
      },
    });

    const optimization = optimizationAnalysis.data || {};
    const newParams = optimization.optimized_parameters || currentParams;

    // Update agent with new parameters and performance metrics
    const iterationCount = (currentPerformance.iterations || 0) + 1;
    const avgSatisfaction = (
      (currentPerformance.user_satisfaction || 0) * (iterationCount - 1) + feedbackScore
    ) / iterationCount;

    const updatedAgent = await base44.asServiceRole.entities.AgentDeployment.update(
      agentId,
      {
        parameters: newParams,
        feedback_score: feedbackScore,
        result,
        execution_time_ms: executionTimeMs,
        status: feedbackScore > 0.8 ? 'completed' : 'optimizing',
        performance: {
          efficiency: 1 - executionTimeMs / 5000, // Normalize to 0-1
          accuracy: feedbackScore,
          user_satisfaction: avgSatisfaction,
          iterations: iterationCount,
        },
        optimization_count: (agent.optimization_count || 0) + 1,
      }
    );

    return Response.json({
      agentId,
      previousParams: currentParams,
      optimizedParams: newParams,
      improvements: optimization.improvements || [],
      optimizationConfidence: optimization.confidence || 0.7,
      newPerformance: updatedAgent.performance,
      shouldContinueOptimizing: avgSatisfaction < 0.85 && iterationCount < 5,
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});