import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, language = 'javascript', focusAreas = [] } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    const prompt = `Analyze and refactor the following ${language} code. Focus on: ${focusAreas.join(', ') || 'readability, performance, maintainability'}.

Provide:
1. Refactored code with improvements
2. List of specific changes made
3. Performance impact estimation
4. Best practices applied

Original code:
\`\`\`${language}
${code}
\`\`\``;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          refactored_code: { type: 'string' },
          changes: {
            type: 'array',
            items: { type: 'string' }
          },
          performance_impact: { type: 'string' },
          best_practices: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      success: true,
      refactoring: result
    });
  } catch (error) {
    console.error('Code refactoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});