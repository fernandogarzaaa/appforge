import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await req.json();

    // Fetch agent
    const agents = await base44.asServiceRole.entities.CustomAgent.filter({ id: agentId });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];
    const metrics = agent.performance_metrics || {};
    const recommendations = [];

    // Check accuracy - target 85%+
    if ((metrics.accuracy || 0) < 0.85) {
      recommendations.push({
        type: 'parameter_adjustment',
        priority: metrics.accuracy < 0.7 ? 'critical' : 'high',
        title: 'Improve Response Accuracy',
        description: 'Your agent accuracy is below optimal. Increase the accuracy parameter and add targeted training examples.',
        rationale: {
          performance_metric: 'accuracy',
          current_value: metrics.accuracy || 0,
          target_value: 0.85,
          gap_percentage: ((0.85 - (metrics.accuracy || 0)) / 0.85) * 100
        },
        expected_improvement: 15,
        suggested_action: {
          parameter: 'accuracy',
          increase_by: 0.2
        }
      });
    }

    // Check satisfaction - target 80%+
    if ((metrics.user_satisfaction || 0) < 0.8) {
      recommendations.push({
        type: 'training_exercise',
        priority: metrics.user_satisfaction < 0.6 ? 'critical' : 'high',
        title: 'Enhance User Satisfaction',
        description: 'User feedback indicates dissatisfaction. Add training examples focused on clarity and relevance.',
        rationale: {
          performance_metric: 'user_satisfaction',
          current_value: metrics.user_satisfaction || 0,
          target_value: 0.8,
          gap_percentage: ((0.8 - (metrics.user_satisfaction || 0)) / 0.8) * 100
        },
        expected_improvement: 20,
        suggested_action: {
          exercise_type: 'clarity_and_relevance',
          minimum_examples: 5
        }
      });
    }

    // Check training iterations - suggest optimization if low
    if ((metrics.training_iterations || 0) < 3) {
      recommendations.push({
        type: 'training_exercise',
        priority: 'high',
        title: 'Complete Training Iterations',
        description: `Your agent needs more training iterations (${metrics.training_iterations || 0}/3). Add more training examples.`,
        rationale: {
          performance_metric: 'training_iterations',
          current_value: metrics.training_iterations || 0,
          target_value: 3,
          gap_percentage: ((3 - (metrics.training_iterations || 0)) / 3) * 100
        },
        expected_improvement: 25,
        suggested_action: {
          exercise_type: 'general_training',
          minimum_examples: 3 - (metrics.training_iterations || 0)
        }
      });
    }

    // Check feedback - suggest collaboration pattern learning if feedback available
    const feedbackRecords = await base44.asServiceRole.entities.AgentFeedback.filter({
      agent_id: agentId,
      applied_to_training: false
    });

    if (feedbackRecords.length > 0) {
      const avgRating = feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length;
      if (avgRating < 3) {
        recommendations.push({
          type: 'collaboration_pattern',
          priority: 'high',
          title: 'Learn from Successful Patterns',
          description: 'Multiple low ratings suggest you should learn collaboration patterns from high-performing agents.',
          rationale: {
            performance_metric: 'feedback_rating',
            current_value: avgRating,
            target_value: 4,
            gap_percentage: ((4 - avgRating) / 4) * 100
          },
          expected_improvement: 18,
          suggested_action: {
            action: 'find_collaboration_patterns',
            domain: agent.parameters?.expertise_domain || 'general'
          }
        });
      }
    }

    // Store recommendations
    const storedRecs = [];
    for (const rec of recommendations) {
      const stored = await base44.asServiceRole.entities.AgentCoachingRecommendation.create({
        agent_id: agentId,
        user_id: user.email,
        recommendation_type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        rationale: rec.rationale,
        expected_improvement: rec.expected_improvement,
        suggested_action: rec.suggested_action
      });
      storedRecs.push(stored);
    }

    return Response.json({
      success: true,
      agentId,
      recommendationCount: storedRecs.length,
      recommendations: storedRecs.map(r => ({
        id: r.id,
        type: r.recommendation_type,
        priority: r.priority,
        title: r.title
      }))
    });

  } catch (error) {
    console.error('Coaching analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});