import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, category, context } = await req.json();

    // Determine which agents to deploy based on prompt analysis
    const agentsToDeployAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this user prompt and determine which AI agents should be auto-deployed:

Prompt: "${prompt}"
Category: ${category}
Context: ${JSON.stringify(context || {})}

Respond with JSON: {
  "agents": [
    {
      "type": "quantum|analysis|generation|optimization|monitoring",
      "name": "descriptive name",
      "reasoning": "why deploy this agent",
      "initial_parameters": {
        "temperature": 0-1,
        "creativity": 0-1,
        "accuracy": 0-1,
        "speed": 0-1
      }
    }
  ],
  "priority": "high|medium|low"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          agents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                name: { type: 'string' },
                reasoning: { type: 'string' },
                initial_parameters: { type: 'object' },
              },
            },
          },
          priority: { type: 'string' },
        },
      },
    });

    const deploymentPlan = agentsToDeployAnalysis.data || {};
    const deployedAgents = [];

    // Deploy each recommended agent
    for (const agent of deploymentPlan.agents || []) {
      try {
        const deployment = await base44.asServiceRole.entities.AgentDeployment.create({
          user_id: user.email,
          agent_name: agent.name,
          agent_type: agent.type,
          prompt,
          parameters: agent.initial_parameters || {
            temperature: 0.7,
            creativity: 0.6,
            accuracy: 0.8,
            speed: 0.7,
          },
          status: 'running',
          performance: {
            efficiency: 0,
            accuracy: 0,
            user_satisfaction: 0,
            iterations: 0,
          },
        });

        deployedAgents.push({
          id: deployment.id,
          name: agent.name,
          type: agent.type,
          reasoning: agent.reasoning,
          status: 'running',
        });
      } catch (deployError) {
        console.error(`Failed to deploy ${agent.name}:`, deployError);
      }
    }

    return Response.json({
      deployedCount: deployedAgents.length,
      agents: deployedAgents,
      priority: deploymentPlan.priority || 'medium',
      totalDeployed: deployedAgents.length,
    });
  } catch (error) {
    console.error('Auto-deploy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});