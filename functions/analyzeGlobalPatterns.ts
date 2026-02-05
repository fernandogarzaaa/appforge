import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analyze patterns across ALL projects for global insights
 * Uses QuantumAI to identify trends, vulnerabilities, and optimizations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all projects and their components
    const [projects, allEntities, allPages, allComponents, healthReports] = await Promise.all([
      base44.asServiceRole.entities.Project.list(),
      base44.asServiceRole.entities.Entity.list('-updated_date', 100),
      base44.asServiceRole.entities.Page.list('-updated_date', 100),
      base44.asServiceRole.entities.Component.list('-updated_date', 100),
      base44.asServiceRole.entities.ProjectHealthReport.list('-scan_timestamp', 50)
    ]);

    // Aggregate statistics
    const stats = {
      total_projects: projects.length,
      total_entities: allEntities.length,
      total_pages: allPages.length,
      total_components: allComponents.length,
      avg_health_score: healthReports.length > 0 
        ? healthReports.reduce((sum, r) => sum + (r.health_score || 0), 0) / healthReports.length 
        : 0,
      common_issues: {},
      entity_patterns: {},
      code_patterns: {}
    };

    // Analyze common issues
    healthReports.forEach(report => {
      report.issues_found?.forEach(issue => {
        const key = `${issue.severity}-${issue.category}`;
        stats.common_issues[key] = (stats.common_issues[key] || 0) + 1;
      });
    });

    // Analyze entity patterns
    allEntities.forEach(entity => {
      const propCount = Object.keys(entity.schema?.properties || {}).length;
      stats.entity_patterns[entity.name] = propCount;
    });

    // Use QuantumAI to analyze patterns
    const result = await base44.functions.invoke('quantumLLM', {
      prompt: `Analyze these cross-project patterns and provide strategic insights:

**Platform Statistics:**
- Projects: ${stats.total_projects}
- Entities: ${stats.total_entities}
- Pages: ${stats.total_pages}
- Avg Health: ${Math.round(stats.avg_health_score)}/100

**Common Issues (Top 10):**
${Object.entries(stats.common_issues)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([issue, count]) => `- ${issue}: ${count} occurrences`)
  .join('\n')}

**Entity Patterns:**
${Object.entries(stats.entity_patterns)
  .slice(0, 15)
  .map(([name, props]) => `- ${name}: ${props} properties`)
  .join('\n')}

Identify:
1. **Emerging Trends**: What patterns are developers adopting?
2. **Common Vulnerabilities**: Security issues across projects
3. **Performance Optimizations**: Cross-cutting improvements
4. **Best Practices**: Patterns from high-health projects
5. **Anti-Patterns**: Common mistakes to avoid

For each insight, provide:
- Type (trend/vulnerability/optimization/best_practice/anti_pattern)
- Severity (info/low/medium/high/critical)
- Affected project count estimate
- Actionable recommendations
- Code examples where applicable`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                severity: { type: "string" },
                affected_count: { type: "number" },
                confidence: { type: "number" },
                recommendations: {
                  type: "array",
                  items: { type: "string" }
                },
                code_example: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    const analysis = result.data.result;

    // Store insights in database
    const savedInsights = [];
    for (const insight of analysis.insights || []) {
      try {
        const saved = await base44.asServiceRole.entities.GlobalInsight.create({
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          affected_projects_count: insight.affected_count,
          confidence: insight.confidence,
          quantum_validated: true,
          recommendations: insight.recommendations || [],
          code_examples: insight.code_example ? [{
            language: 'javascript',
            code: insight.code_example,
            description: 'Example implementation'
          }] : [],
          is_active: true
        });
        savedInsights.push(saved);
      } catch (e) {
        console.error('Failed to save insight:', e);
      }
    }

    return Response.json({
      success: true,
      stats,
      insights: savedInsights,
      summary: analysis.summary,
      quantum_enhanced: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Global analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});