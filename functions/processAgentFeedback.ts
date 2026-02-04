import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId, rating, comments, responseQuality } = await req.json();

    if (!agentId || rating < 1 || rating > 5) {
      return Response.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    // Store feedback
    const feedback = await base44.asServiceRole.entities.AgentFeedback.create({
      agent_id: agentId,
      user_id: user.email,
      rating,
      comments,
      response_quality: responseQuality || {},
      should_retrain: rating <= 2
    });

    // Collect all unapplied feedback
    const allFeedback = await base44.asServiceRole.entities.AgentFeedback.filter({
      agent_id: agentId,
      applied_to_training: false
    });

    // If we have enough feedback (3+), trigger retraining
    const shouldRetrain = allFeedback.length >= 3;

    if (shouldRetrain) {
      // Calculate average metrics
      const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
      const avgQuality = Object.keys(allFeedback[0].response_quality || {}).reduce((acc, key) => {
        acc[key] = allFeedback.reduce((sum, f) => sum + (f.response_quality?.[key] || 0), 0) / allFeedback.length;
        return acc;
      }, {});

      // Fetch agent
      const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
      if (agents.length > 0) {
        const agent = agents[0];

        // Update agent training data with feedback insights
        const updatedTrainingData = agent.training_data || [];
        updatedTrainingData.push({
          input: `Feedback analysis: average rating ${avgRating}`,
          expected_output: `Focus areas: ${Object.entries(avgQuality).map(([k, v]) => `${k}:${(v * 100).toFixed(0)}%`).join(', ')}`,
          feedback: 'From user ratings and quality assessments',
          iteration: (agent.performance_metrics?.training_iterations || 0) + 1
        });

        // Update agent metrics
        await base44.asServiceRole.entities.CustomAgent.update(agentId, {
          training_data: updatedTrainingData,
          performance_metrics: {
            ...agent.performance_metrics,
            user_satisfaction: Math.min(1, avgRating / 5),
            training_iterations: (agent.performance_metrics?.training_iterations || 0) + 1
          }
        });

        // Mark feedback as applied
        for (const fb of allFeedback) {
          await base44.asServiceRole.entities.AgentFeedback.update(fb.id, {
            applied_to_training: true
          });
        }
      }
    }

    return Response.json({
      success: true,
      feedbackId: feedback.id,
      shouldRetrain,
      feedbackCount: allFeedback.length,
      retrainingTriggered: shouldRetrain
    });

  } catch (error) {
    console.error('Feedback processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});