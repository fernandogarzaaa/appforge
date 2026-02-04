import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, projectDescription, pages = [], components = [], userMetrics = {} } = await req.json();

    if (!projectId || !projectDescription) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const prompt = `Analyze this project and suggest UI/UX improvements based on modern best practices:

Project: ${projectDescription}
${pages.length > 0 ? `\nPages: ${pages.map(p => p.name).join(', ')}` : ''}
${components.length > 0 ? `\nComponents: ${components.map(c => c.name).join(', ')}` : ''}
${Object.keys(userMetrics).length > 0 ? `\nUser Metrics: ${JSON.stringify(userMetrics)}` : ''}

Provide actionable suggestions for:
1. Visual hierarchy and layout improvements
2. Color scheme and typography enhancements
3. Accessibility improvements (WCAG 2.1 AA)
4. Mobile responsiveness optimization
5. User flow and navigation improvements
6. Loading states and feedback mechanisms
7. Micro-interactions and animations
8. Dark mode implementation
9. Performance-related UX improvements
10. Conversion optimization tips

Include code examples where applicable.
Return JSON: { "suggestions": [...], "priorityOrder": [...], "implementationGuide": {...} }`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                impact: { type: 'string' },
                effort: { type: 'string' },
                implementation: { type: 'string' }
              }
            }
          },
          priorityOrder: { type: 'array', items: { type: 'string' } },
          implementationGuide: {
            type: 'object',
            properties: {
              quickWins: { type: 'array', items: { type: 'string' } },
              mediumTerm: { type: 'array', items: { type: 'string' } },
              longTerm: { type: 'array', items: { type: 'string' } }
            }
          },
          accessibilityChecklist: { type: 'array', items: { type: 'string' } },
          designTokens: { type: 'object' }
        }
      }
    });

    return Response.json({
      success: true,
      improvements: response,
      suggestionCount: response.suggestions?.length || 0,
      prioritizedActions: response.priorityOrder || []
    });
  } catch (error) {
    console.error('UX improvement analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});