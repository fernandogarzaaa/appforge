import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, language = 'javascript', testFramework = 'jest', functionName } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    const prompt = `Generate comprehensive unit tests for the following ${language} code using ${testFramework}.

Include:
1. Happy path tests
2. Edge case tests
3. Error handling tests
4. Input validation tests

Code to test:
\`\`\`${language}
${code}
\`\`\`

${functionName ? `Focus on testing the "${functionName}" function.` : ''}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          test_code: { type: 'string' },
          test_cases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' }
              }
            }
          },
          coverage_areas: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      success: true,
      tests: result
    });
  } catch (error) {
    console.error('Test generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});