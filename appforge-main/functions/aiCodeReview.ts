import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, language, filename } = await req.json();

    if (!code || !language) {
      return Response.json({ error: 'Code and language are required' }, { status: 400 });
    }

    const reviewPrompt = `You are an expert code reviewer. Analyze the following ${language} code and provide detailed feedback.

File: ${filename || 'untitled'}
Language: ${language}

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive review covering:

1. **Best Practices**: Are coding standards and conventions followed?
2. **Bugs**: Are there any logical errors or potential runtime issues?
3. **Performance**: Are there optimization opportunities?
4. **Security**: Are there security vulnerabilities or unsafe patterns?
5. **Code Quality**: Is the code maintainable, readable, and well-structured?

For each issue found, provide:
- Severity (critical, high, medium, low)
- Category (best-practice, bug, performance, security, quality)
- Description of the issue
- Suggested fix or improvement
- Code example if applicable

Return the review as JSON with:
{
  "overall_score": number (0-100),
  "summary": string,
  "issues": [
    {
      "line": number or null,
      "severity": string,
      "category": string,
      "title": string,
      "description": string,
      "suggestion": string,
      "code_example": string or null
    }
  ],
  "strengths": [string],
  "improvements": [string]
}`;

    const reviewResult = await base44.integrations.Core.InvokeLLM({
      prompt: reviewPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          summary: { type: 'string' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                line: { type: ['number', 'null'] },
                severity: { type: 'string' },
                category: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                suggestion: { type: 'string' },
                code_example: { type: ['string', 'null'] }
              }
            }
          },
          strengths: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Log the code review
    await base44.entities.AuditLog.create({
      action: 'code_review_performed',
      performed_by: user.email,
      description: `Code review completed for ${filename || 'untitled'} (${language})`,
      changes: {
        filename: filename || 'untitled',
        language,
        overall_score: reviewResult.overall_score,
        issues_found: reviewResult.issues?.length || 0
      }
    });

    return Response.json({
      success: true,
      review: reviewResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});