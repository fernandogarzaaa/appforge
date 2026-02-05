import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { user_id, role_context, project_context } = body;

    const onboardingConfig = await base44.asServiceRole.entities.OnboardingConfig.list();
    const config = onboardingConfig[0];

    if (!config?.onboarding_enabled) {
      return Response.json({ skipped: true, reason: 'Onboarding disabled' });
    }

    // Generate personalized onboarding content via AI
    const prompt = `Generate a personalized onboarding guide for a ${role_context} user building a project related to: ${project_context}. Include 5 key steps and tips.`;

    const content = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                tips: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          resources: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Create or update onboarding progress
    const progress = {
      user_id,
      current_step: 0,
      total_steps: 5,
      steps_completed: [],
      personalized_content: content,
      role_context,
      project_context,
      started_at: new Date().toISOString(),
      completed: false
    };

    const created = await base44.asServiceRole.entities.OnboardingProgress.create(progress);

    return Response.json({ success: true, progress: created });
  } catch (error) {
    console.error('Onboarding generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});