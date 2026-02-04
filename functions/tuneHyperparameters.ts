import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, iterations = 10 } = await req.json();

    // Fetch agent
    const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];
    const baselineScore = (agent.performance_metrics?.user_satisfaction || 0.5) * 100;
    const tuningRunId = `tune_${Date.now()}`;

    // Define parameter search space
    const parameterRanges = {
      temperature: { min: 0.1, max: 1.0, step: 0.1 },
      creativity: { min: 0, max: 1, step: 0.1 },
      accuracy: { min: 0, max: 1, step: 0.1 }
    };

    const tuningIterations = [];
    let bestScore = baselineScore;
    let bestParameters = { ...agent.parameters };

    // Simulate hyperparameter search using Bayesian optimization concept
    for (let i = 0; i < iterations; i++) {
      const currentParams = {
        temperature: 0.3 + (i * 0.05),
        creativity: 0.4 + (Math.random() * 0.3),
        accuracy: 0.6 + (Math.random() * 0.35)
      };

      // Score computation with feedback consideration
      const feedbackRecords = await base44.asServiceRole.entities.AgentFeedback.filter({
        agent_id: agentId,
        applied_to_training: false
      });

      const avgFeedback = feedbackRecords.length > 0
        ? (feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length) * 20
        : 50;

      const performanceScore = avgFeedback * (1 - Math.random() * 0.2);

      tuningIterations.push({
        iteration_num: i + 1,
        parameters: currentParams,
        performance_score: performanceScore,
        timestamp: new Date().toISOString()
      });

      if (performanceScore > bestScore) {
        bestScore = performanceScore;
        bestParameters = currentParams;
      }
    }

    const improvementPercentage = ((bestScore - baselineScore) / baselineScore) * 100;

    // Create tuning record
    const tuningRecord = await base44.asServiceRole.entities.HyperparameterTuning.create({
      agent_id: agentId,
      tuning_run_id: tuningRunId,
      initial_parameters: agent.parameters,
      optimized_parameters: bestParameters,
      parameter_ranges: parameterRanges,
      iterations: tuningIterations,
      best_score: bestScore,
      improvement_percentage: Math.max(0, improvementPercentage),
      status: 'completed'
    });

    return Response.json({
      success: true,
      tuningRunId,
      bestScore: bestScore.toFixed(2),
      improvement: improvementPercentage.toFixed(2),
      optimizedParameters: bestParameters,
      iterations: tuningIterations.length,
      recordId: tuningRecord.id
    });

  } catch (error) {
    console.error('Tuning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});