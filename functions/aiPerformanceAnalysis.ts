import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, usagePatterns = {}, constraints = {} } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    const prompt = `Analyze the following code for performance bottlenecks and optimization opportunities.

Usage patterns: ${JSON.stringify(usagePatterns)}
Constraints: ${JSON.stringify(constraints)}

Code:
\`\`\`
${code}
\`\`\`

Identify:
1. Potential bottlenecks with severity (critical/high/medium/low)
2. Root cause analysis
3. Specific optimization recommendations
4. Expected performance improvements
5. Estimated implementation complexity`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          bottlenecks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                severity: { type: 'string' },
                impact: { type: 'string' },
                line_reference: { type: 'string' }
              }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                issue: { type: 'string' },
                solution: { type: 'string' },
                complexity: { type: 'string' },
                expected_improvement: { type: 'string' }
              }
            }
          },
          optimized_code_snippet: { type: 'string' },
          priority_index: { type: 'number' }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: result
    });
  } catch (error) {
    console.error('Performance analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});