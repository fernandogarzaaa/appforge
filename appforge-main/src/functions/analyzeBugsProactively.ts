import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent data for analysis
    const [tickets, logs, feedback] = await Promise.all([
      base44.entities.SupportTicket.list('-created_date', 50),
      base44.entities.AuditLog.list('-created_date', 100),
      base44.entities.AIFeedback?.list?.('-created_date', 50) || []
    ]);

    // Prepare analysis data
    const analysisPrompt = `Analyze the following application data and identify potential bugs:

RECENT TICKETS:
${JSON.stringify(tickets.slice(0, 20), null, 2)}

APPLICATION LOGS:
${JSON.stringify(logs.slice(0, 30), null, 2)}

USER FEEDBACK:
${JSON.stringify(Array.isArray(feedback) ? feedback.slice(0, 20) : [], null, 2)}

For each potential bug, provide:
1. Bug title
2. Description
3. Affected components/areas
4. Severity (critical/high/medium/low)
5. Likelihood of occurrence (percentage)
6. Recommended priority (1-10)
7. Suggested fix approach

Return as JSON array with these fields: title, description, affected_components, severity, likelihood, priority, suggested_fix`;

    // Use AI to analyze for bugs
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          bugs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                affected_components: { type: 'array', items: { type: 'string' } },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                likelihood: { type: 'number' },
                priority: { type: 'number' },
                suggested_fix: { type: 'string' }
              }
            }
          },
          summary: { type: 'string' },
          confidence_score: { type: 'number' }
        }
      }
    });

    const detectedBugs = analysisResult.bugs || [];
    const summary = analysisResult.summary || '';
    const confidenceScore = analysisResult.confidence_score || 0;

    // Log the analysis
    await base44.entities.AuditLog.create({
      action: 'proactive_bug_analysis',
      performed_by: user.email,
      description: `Analyzed application for bugs. Detected ${detectedBugs.length} potential issues.`,
      changes: {
        bugs_detected: detectedBugs.length,
        confidence_score: confidenceScore,
        summary
      }
    });

    return Response.json({
      success: true,
      bugs_detected: detectedBugs.length,
      bugs: detectedBugs,
      summary,
      confidence_score: confidenceScore,
      analysis_timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});