import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, code, errorLogs = [], testCoverage = [] } = await req.json();

    if (!projectId || !code) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const prompt = `Analyze this code for bugs, performance issues, and suggest fixes:

${code}

${errorLogs.length > 0 ? `\nError Logs:\n${errorLogs.join('\n')}` : ''}
${testCoverage.length > 0 ? `\nCurrent Test Coverage:\n${testCoverage.join('\n')}` : ''}

Provide:
1. Identified bugs with line numbers
2. Potential runtime issues
3. Performance optimizations
4. Security vulnerabilities
5. Test cases to add
6. Fixed code snippets
7. Severity levels (critical, high, medium, low)

Return JSON: { "issues": [...], "fixes": [...], "testCases": [...], "performanceTips": [...] }`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string' },
                line: { type: 'number' },
                description: { type: 'string' },
                fix: { type: 'string' }
              }
            }
          },
          fixes: { type: 'array', items: { type: 'string' } },
          testCases: { type: 'array', items: { type: 'string' } },
          performanceTips: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: response,
      issueCount: response.issues?.length || 0,
      testCaseSuggestions: response.testCases || []
    });
  } catch (error) {
    console.error('Testing/debugging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});