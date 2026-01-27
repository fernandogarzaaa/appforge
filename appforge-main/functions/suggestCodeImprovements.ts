import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, context, entity_type } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    const suggestionPrompt = `You are an expert code architect and optimization specialist. Analyze the following code and provide actionable suggestions for improvement.

Context: ${context || 'General code review'}
Code Type: ${entity_type || 'backend function'}

\`\`\`
${code}
\`\`\`

Provide specific, actionable suggestions covering:
1. Refactoring opportunities
2. Performance improvements
3. Code simplification
4. Error handling improvements
5. Best practices

Format response as JSON:
{
  "suggestions": [
    {
      "area": string (refactoring|performance|simplification|error-handling|best-practices),
      "priority": string (high|medium|low),
      "title": string,
      "description": string,
      "current_code": string,
      "suggested_code": string,
      "benefit": string
    }
  ],
  "summary": string,
  "estimated_improvement": string
}`;

    const suggestionResult = await base44.integrations.Core.InvokeLLM({
      prompt: suggestionPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                area: { type: 'string' },
                priority: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                current_code: { type: 'string' },
                suggested_code: { type: 'string' },
                benefit: { type: 'string' }
              }
            }
          },
          summary: { type: 'string' },
          estimated_improvement: { type: 'string' }
        }
      }
    });

    // Log suggestions
    await base44.entities.AuditLog.create({
      action: 'code_suggestions_generated',
      performed_by: user.email,
      description: `Generated ${suggestionResult.suggestions?.length || 0} code improvement suggestions`,
      changes: {
        suggestions_count: suggestionResult.suggestions?.length || 0,
        context
      }
    });

    return Response.json({
      success: true,
      suggestions: suggestionResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});