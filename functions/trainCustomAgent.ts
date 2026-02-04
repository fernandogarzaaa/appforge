import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, trainingInput, expectedOutput, feedback } = await req.json();

    // Fetch agent
    const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];
    const currentMetrics = agent.performance_metrics || {};

    // Add training sample
    const newTrainingData = agent.training_data || [];
    newTrainingData.push({
      input: trainingInput,
      expected_output: expectedOutput,
      feedback,
      iteration: (currentMetrics.training_iterations || 0) + 1,
    });

    // Use LLM to optimize agent based on feedback
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Optimize this AI agent based on user feedback:

Agent: ${agent.agent_name}
Goal: ${agent.goal}
Current Parameters: ${JSON.stringify(agent.parameters || {})}

Recent Training Sample:
Input: "${trainingInput}"
Expected Output: "${expectedOutput}"
User Feedback: "${feedback}"

Training Iterations: ${currentMetrics.training_iterations || 0}
Current Satisfaction: ${currentMetrics.user_satisfaction || 0}

Provide optimized parameters as JSON: {
  "optimized_parameters": {
    "personality": "refined personality",
    "response_style": "refined style",
    "temperature": 0-1,
    "creativity": 0-1,
    "accuracy": 0-1
  },
  "improvements": ["improvement 1", "improvement 2"],
  "new_accuracy": 0-1
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          optimized_parameters: { type: 'object' },
          improvements: { type: 'array', items: { type: 'string' } },
          new_accuracy: { type: 'number' },
        },
      },
    });

    const optimization_result = optimization.data || {};
    const feedbackScore = feedback.toLowerCase().includes('good') ? 0.9 : 
                         feedback.toLowerCase().includes('ok') ? 0.6 : 0.3;

    // Update agent with new training and parameters
    const updatedAgent = await base44.asServiceRole.entities.CustomAgent.update(agentId, {
      training_data: newTrainingData,
      parameters: optimization_result.optimized_parameters || agent.parameters,
      performance_metrics: {
        accuracy: optimization_result.new_accuracy || feedbackScore,
        user_satisfaction: (
          ((currentMetrics.user_satisfaction || 0) * (currentMetrics.training_iterations || 1)) + feedbackScore
        ) / ((currentMetrics.training_iterations || 1) + 1),
        training_iterations: (currentMetrics.training_iterations || 0) + 1,
        last_training: new Date().toISOString(),
      },
      version: (agent.version || 1) + 1,
    });

    // Capture this learning for super intelligence
    if (user) {
      await base44.entities.Learning.create({
        user_id: user.email,
        prompt: `Custom agent training: ${agent.agent_name}`,
        response: expectedOutput,
        feedback_score: feedbackScore,
        category: 'custom_agent',
        extracted_patterns: [agent.goal, agent.parameters?.expertise_domain || 'general'],
        learning_weight: 0.8,
      });
    }

    return Response.json({
      agentId,
      agentName: agent.agent_name,
      trainingIteration: updatedAgent.performance_metrics.training_iterations,
      accuracy: updatedAgent.performance_metrics.accuracy,
      improvements: optimization_result.improvements || [],
      readyForDeployment: updatedAgent.performance_metrics.training_iterations >= 3,
    });
  } catch (error) {
    console.error('Training error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});