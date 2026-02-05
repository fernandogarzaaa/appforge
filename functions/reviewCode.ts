import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, language, review_type, file_name } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code required' }, { status: 400 });
    }

    const reviewPrompt = `You are an expert code reviewer with deep knowledge of security, performance, and best practices.

REVIEW TYPE: ${review_type || 'comprehensive'}
LANGUAGE: ${language || 'auto-detect'}
FILE: ${file_name || 'untitled'}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\`

Perform a thorough code review and return a structured analysis:

1. **Critical Issues** (bugs, security vulnerabilities, breaking changes)
2. **Performance Issues** (bottlenecks, inefficiencies, memory leaks)
3. **Code Quality** (readability, maintainability, best practices)
4. **Security Analysis** (vulnerabilities, unsafe patterns, injection risks)
5. **Suggested Improvements** (refactoring, optimization, modern patterns)

For each issue:
- Severity: critical, high, medium, low
- Line numbers (if applicable)
- Specific description
- Why it's a problem
- How to fix it (with code example if needed)

Return JSON with this structure:
{
  "overall_score": 0-100,
  "language_detected": "string",
  "summary": "brief overview",
  "critical_issues": [
    {
      "severity": "critical|high|medium|low",
      "line": number,
      "type": "bug|security|performance|style",
      "title": "string",
      "description": "string",
      "fix": "string",
      "code_example": "string"
    }
  ],
  "performance_issues": [...],
  "code_quality": [...],
  "security_issues": [...],
  "improvements": [...],
  "best_practices": {
    "followed": ["string"],
    "violated": ["string"]
  },
  "complexity_score": 0-100,
  "maintainability_score": 0-100
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: reviewPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          language_detected: { type: "string" },
          summary: { type: "string" },
          critical_issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                line: { type: "number" },
                type: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                fix: { type: "string" },
                code_example: { type: "string" }
              }
            }
          },
          performance_issues: { type: "array", items: { type: "object" } },
          code_quality: { type: "array", items: { type: "object" } },
          security_issues: { type: "array", items: { type: "object" } },
          improvements: { type: "array", items: { type: "object" } },
          best_practices: {
            type: "object",
            properties: {
              followed: { type: "array", items: { type: "string" } },
              violated: { type: "array", items: { type: "string" } }
            }
          },
          complexity_score: { type: "number" },
          maintainability_score: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      review: result
    });

  } catch (error) {
    console.error('Code review error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});