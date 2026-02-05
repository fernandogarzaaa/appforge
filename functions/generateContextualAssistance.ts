import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates contextual AI assistance based on user activity and project context
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      context_page, 
      project_id, 
      user_activity, 
      time_on_page,
      last_actions 
    } = await req.json();

    // Get project context if available
    let projectContext = '';
    if (project_id) {
      const projects = await base44.entities.Project.filter({ id: project_id });
      if (projects.length > 0) {
        projectContext = `Project: ${projects[0].name} - ${projects[0].description || 'No description'}`;
      }
    }

    // Generate contextual assistance
    const response = await base44.functions.invoke('invokeAI', {
      prompt: `You are a proactive AI assistant helping a user on the "${context_page}" page.

Context:
- Page: ${context_page}
- Time on page: ${time_on_page || 0} seconds
- Recent actions: ${last_actions || 'None'}
- ${projectContext}
- User activity: ${user_activity || 'Browsing'}

Based on this context, provide ONE helpful, actionable tip or suggestion. It should:
1. Be specific to what they're doing right now
2. Help them accomplish their goal faster
3. Suggest a relevant feature they might not know about
4. Or help overcome a potential roadblock

Keep it brief (1-2 sentences) and actionable.

Return JSON with:
- assistance_type: "tip", "feature_suggestion", "roadblock_help", or "best_practice"
- title: Short catchy title (5-7 words)
- message: The helpful tip (1-2 sentences)
- action_label: Button text (e.g., "Try it now", "Learn more")
- action_url: Relative URL to navigate to (or null)`,
      response_json_schema: {
        type: "object",
        properties: {
          assistance_type: { 
            type: "string",
            enum: ["tip", "feature_suggestion", "roadblock_help", "best_practice"]
          },
          title: { type: "string" },
          message: { type: "string" },
          action_label: { type: "string" },
          action_url: { type: "string" }
        }
      }
    });

    const assistanceData = response.data.result || response.data;

    // Log the assistance
    await base44.entities.ProactiveAssistance.create({
      user_id: user.email,
      context_page,
      project_id,
      assistance_type: assistanceData.assistance_type,
      content: assistanceData,
      triggered_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      assistance: assistanceData
    });

  } catch (error) {
    console.error('Contextual assistance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});