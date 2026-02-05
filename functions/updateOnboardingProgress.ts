import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Updates user's onboarding progress and provides proactive assistance
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { step_number, action_completed, need_help } = await req.json();

    // Get current progress
    const progress = await base44.entities.OnboardingProgress.filter({ 
      user_id: user.email,
      completed: false 
    });

    if (progress.length === 0) {
      return Response.json({ error: 'No active onboarding found' }, { status: 404 });
    }

    const current = progress[0];
    const nextStep = step_number + 1;
    const isCompleted = nextStep >= current.total_steps;

    // Update progress
    await base44.entities.OnboardingProgress.update(current.id, {
      current_step: nextStep,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : undefined,
      steps_completed: [...(current.steps_completed || []), step_number]
    });

    // Generate proactive assistance if needed
    let proactiveHelp = null;
    if (need_help) {
      const helpResponse = await base44.functions.invoke('invokeAI', {
        prompt: `User needs help with step ${step_number} of onboarding: ${action_completed}. 
        Provide a brief, helpful tip to guide them forward.`,
        response_json_schema: {
          type: "object",
          properties: {
            tip: { type: "string" },
            action_suggestion: { type: "string" }
          }
        }
      });
      proactiveHelp = helpResponse.data.result || helpResponse.data;
    }

    return Response.json({
      success: true,
      next_step: nextStep,
      completed: isCompleted,
      proactive_help: proactiveHelp
    });

  } catch (error) {
    console.error('Progress update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});