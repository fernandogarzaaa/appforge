import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, user_id, activity_data } = await req.json();

    // AI-powered anomaly detection
    const prompt = `You are a cybersecurity expert analyzing user activity for anomalies.

Activity Data:
${JSON.stringify(activity_data, null, 2)}

Analyze this activity for security threats:
1. Unusual access patterns
2. Privilege escalation attempts
3. Data exfiltration indicators
4. Injection attacks
5. Rate limit violations
6. Cross-tenant access attempts

Return JSON with:
{
  "is_anomaly": boolean,
  "threat_type": "string or null",
  "severity": "low|medium|high|critical",
  "risk_score": number 0-100,
  "confidence": number 0-1,
  "reasoning": "explanation",
  "recommended_actions": ["action1", "action2"],
  "should_block": boolean
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          is_anomaly: { type: "boolean" },
          threat_type: { type: "string" },
          severity: { type: "string" },
          risk_score: { type: "number" },
          confidence: { type: "number" },
          reasoning: { type: "string" },
          recommended_actions: { type: "array", items: { type: "string" } },
          should_block: { type: "boolean" }
        }
      }
    });

    if (analysis.is_anomaly) {
      // Create security event
      const event = await base44.asServiceRole.entities.SecurityEvent.create({
        tenant_id,
        user_id,
        event_type: 'access_anomaly',
        severity: analysis.severity,
        risk_score: analysis.risk_score,
        details: activity_data,
        ai_analysis: {
          threat_type: analysis.threat_type,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          recommended_actions: analysis.recommended_actions
        },
        status: 'detected'
      });

      // Automated response if critical
      if (analysis.should_block) {
        await base44.asServiceRole.entities.SecurityEvent.update(event.id, {
          automated_response: {
            action_taken: 'Access blocked - high risk detected',
            blocked: true,
            timestamp: new Date().toISOString()
          },
          status: 'mitigated'
        });

        return Response.json({
          blocked: true,
          event_id: event.id,
          analysis
        });
      }

      return Response.json({
        anomaly_detected: true,
        event_id: event.id,
        analysis
      });
    }

    return Response.json({
      anomaly_detected: false,
      status: 'normal'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});