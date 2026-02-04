import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail } = await req.json();

    // Fetch all necessary data
    const [learnings, deployments, graph] = await Promise.all([
      base44.asServiceRole.entities.Learning.filter({ user_id: userEmail }, '-updated_date', 50),
      base44.asServiceRole.entities.AgentDeployment.filter({ user_id: userEmail }, '-updated_date', 30),
      base44.asServiceRole.entities.KnowledgeGraph.filter({ user_id: userEmail }, '-updated_date', 1),
    ]);

    // Generate anticipatory insights using AI
    const anticipation = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this user's interaction history and patterns, generate proactive assistance recommendations:

Recent Learnings (last 10):
${learnings.slice(0, 10).map(l => `- ${l.category}: ${l.prompt.substring(0, 50)}... (satisfaction: ${(l.feedback_score * 100).toFixed(0)}%)`).join('\n')}

Agent Performance:
${deployments.slice(0, 5).map(a => `- ${a.agent_type}: ${(a.performance?.user_satisfaction * 100).toFixed(0)}% satisfaction, ${a.performance?.iterations || 1} iterations`).join('\n')}

Knowledge Graph Patterns:
${graph?.[0]?.emergent_patterns?.join(', ') || 'Building...'}

Provide JSON response with:
{
  "proactive_suggestions": [
    {
      "type": "action|warning|insight|agent_deployment",
      "priority": "high|medium|low",
      "title": "suggestion title",
      "description": "detailed explanation",
      "action": "specific action to take",
      "reasoning": "why this is relevant now"
    }
  ],
  "context_warnings": ["warning 1", "warning 2"],
  "personalization": {
    "recommended_theme": "light|dark|quantum",
    "layout_focus": "domain specialization focus area",
    "ui_customizations": ["custom 1", "custom 2"]
  }
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          proactive_suggestions: {
            type: 'array',
            items: { type: 'object' },
          },
          context_warnings: { type: 'array', items: { type: 'string' } },
          personalization: { type: 'object' },
        },
      },
    });

    // Determine specialization for personalization
    const categories = {};
    learnings.forEach(l => {
      categories[l.category] = (categories[l.category] || 0) + 1;
    });
    const dominantDomain = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    // Calculate urgency score (should we push suggestions now?)
    const timeSinceLastInteraction = learnings.length > 0 ?
      Date.now() - new Date(learnings[0].created_date).getTime() : Infinity;
    const shouldProactivelyEngage = timeSinceLastInteraction > 600000; // 10 minutes

    return Response.json({
      suggestions: anticipation.data?.proactive_suggestions || [],
      warnings: anticipation.data?.context_warnings || [],
      personalization: {
        ...anticipation.data?.personalization,
        dominant_domain: dominantDomain,
        engagement_score: Math.min(1, learnings.length / 50),
        should_engage_now: shouldProactivelyEngage,
      },
      analysis: {
        learning_trend: learnings.length > 10 ? 'increasing' : 'stable',
        best_agent: deployments
          .sort((a, b) => (b.performance?.user_satisfaction || 0) - (a.performance?.user_satisfaction || 0))
          .slice(0, 1)[0]?.agent_type || null,
        next_likely_action: graph?.[0]?.emergent_patterns?.[0] || null,
      },
    });
  } catch (error) {
    console.error('Anticipation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});