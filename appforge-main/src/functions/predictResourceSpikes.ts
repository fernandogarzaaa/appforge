import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource_metrics } = await req.json();

    if (!resource_metrics) {
      return Response.json({ error: 'Resource metrics are required' }, { status: 400 });
    }

    const predictionPrompt = `You are an infrastructure optimization expert analyzing system resource usage patterns.

CURRENT METRICS:
${JSON.stringify(resource_metrics, null, 2)}

Based on this data, provide:
1. **Spike Predictions**: Identify which automations/workflows might experience resource spikes in the next 24 hours
2. **Root Causes**: Explain why spikes might occur
3. **Scaling Strategies**: Recommend horizontal or vertical scaling
4. **Optimizations**: Suggest code/config improvements to reduce resource usage
5. **Cost Analysis**: Estimate cost impact of current vs optimized usage

Return as JSON:
{
  "predictions": [
    {
      "resource_type": string (cpu|memory|network),
      "probability": number (0-100),
      "severity": string (low|medium|high|critical),
      "affected_processes": [string],
      "predicted_peak_time": string (ISO datetime or relative),
      "predicted_usage": number
    }
  ],
  "scaling_strategies": [
    {
      "type": string (horizontal|vertical),
      "target": string (automation|workflow name),
      "recommendation": string,
      "expected_improvement": string,
      "estimated_cost_impact": string
    }
  ],
  "optimizations": [
    {
      "process": string,
      "issue": string,
      "optimization": string,
      "resource_savings_percent": number,
      "implementation_difficulty": string (easy|medium|hard)
    }
  ],
  "cost_analysis": {
    "current_monthly_estimate": string,
    "optimized_monthly_estimate": string,
    "potential_savings_percent": number,
    "roi_timeline_days": number
  }
}`;

    const predictionResult = await base44.integrations.Core.InvokeLLM({
      prompt: predictionPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          predictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resource_type: { type: 'string' },
                probability: { type: 'number' },
                severity: { type: 'string' },
                affected_processes: { type: 'array', items: { type: 'string' } },
                predicted_peak_time: { type: 'string' },
                predicted_usage: { type: 'number' }
              }
            }
          },
          scaling_strategies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                target: { type: 'string' },
                recommendation: { type: 'string' },
                expected_improvement: { type: 'string' },
                estimated_cost_impact: { type: 'string' }
              }
            }
          },
          optimizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                process: { type: 'string' },
                issue: { type: 'string' },
                optimization: { type: 'string' },
                resource_savings_percent: { type: 'number' },
                implementation_difficulty: { type: 'string' }
              }
            }
          },
          cost_analysis: {
            type: 'object',
            properties: {
              current_monthly_estimate: { type: 'string' },
              optimized_monthly_estimate: { type: 'string' },
              potential_savings_percent: { type: 'number' },
              roi_timeline_days: { type: 'number' }
            }
          }
        }
      }
    });

    // Log predictions
    await base44.entities.AuditLog.create({
      action: 'resource_spike_prediction',
      performed_by: user.email,
      description: 'Generated resource spike predictions and optimization recommendations',
      changes: {
        predictions_generated: predictionResult.predictions?.length || 0,
        scaling_strategies: predictionResult.scaling_strategies?.length || 0,
        optimizations_suggested: predictionResult.optimizations?.length || 0,
        potential_savings_percent: predictionResult.cost_analysis?.potential_savings_percent || 0
      }
    });

    return Response.json({
      success: true,
      analysis: predictionResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});