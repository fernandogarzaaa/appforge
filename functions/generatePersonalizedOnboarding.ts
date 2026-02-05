import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates personalized onboarding steps based on user role and initial interaction
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_role, project_idea, interaction_context } = await req.json();

    // Generate personalized onboarding with AI
    const response = await base44.functions.invoke('invokeAI', {
      prompt: `Generate a personalized onboarding flow for a user with the following profile:
      
Role: ${user_role || 'developer'}
Initial Project Idea: ${project_idea || 'Not specified yet'}
Context: ${interaction_context || 'First time user'}

Create a tailored 5-step onboarding journey that:
1. Welcomes the user based on their role
2. Guides them through the most relevant features
3. Provides context-specific tutorials
4. Helps them complete their first project quickly
5. Encourages deployment

Return the response as JSON with this structure:
- welcome_message: Personalized welcome
- steps: Array of 5 onboarding steps, each with:
  - step_number: 1-5
  - title: Step title
  - description: What user will learn
  - action: What they should do
  - page: Which page to navigate to
  - tutorial_content: Brief tutorial text
  - estimated_minutes: Time estimate
  - proactive_tips: Array of helpful tips`,
      response_json_schema: {
        type: "object",
        properties: {
          welcome_message: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                action: { type: "string" },
                page: { type: "string" },
                tutorial_content: { type: "string" },
                estimated_minutes: { type: "number" },
                proactive_tips: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      }
    });

    // Create onboarding progress record
    const onboardingData = response.data.result || response.data;
    await base44.entities.OnboardingProgress.create({
      user_id: user.email,
      current_step: 0,
      total_steps: 5,
      personalized_content: onboardingData,
      started_at: new Date().toISOString(),
      role_context: user_role,
      project_context: project_idea
    });

    return Response.json({
      success: true,
      onboarding: onboardingData
    });

  } catch (error) {
    console.error('Onboarding generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});