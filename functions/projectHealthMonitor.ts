import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all projects
    const projects = await base44.asServiceRole.entities.Project.list();
    
    if (!projects || projects.length === 0) {
      return Response.json({ message: 'No projects to monitor', scanned: 0 });
    }

    const reports = [];

    for (const project of projects) {
      // Fetch project structure
      const [entities, pages, components] = await Promise.all([
        base44.asServiceRole.entities.Entity.filter({ project_id: project.id }).catch(() => []),
        base44.asServiceRole.entities.Page.filter({ project_id: project.id }).catch(() => []),
        base44.asServiceRole.entities.Component.filter({ project_id: project.id }).catch(() => [])
      ]);

      // AI Analysis
      const analysisPrompt = `Analyze this project and identify issues and improvements:

**Project:** ${project.name}
**Status:** ${project.status || 'unknown'}
**Entities:** ${entities.length} (${entities.map(e => e.name).join(', ')})
**Pages:** ${pages.length} (${pages.map(p => p.name).join(', ')})
**Components:** ${components.length}

**Entity Schemas:**
${entities.slice(0, 3).map(e => `${e.name}: ${JSON.stringify(e.schema?.properties || {}).substring(0, 200)}`).join('\n')}

Identify:
1. **Critical Issues** - Security risks, broken relationships, missing required fields
2. **Performance Issues** - Unindexed queries, large data fetches, inefficient patterns
3. **Architecture Issues** - Poor structure, missing entities, code duplication
4. **Quick Wins** - Easy improvements that add value
5. **Best Practices** - Missing validations, error handling, testing

Prioritize by impact and effort.`;

      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            critical_issues: { type: "array", items: { type: "string" } },
            performance_issues: { type: "array", items: { type: "string" } },
            architecture_issues: { type: "array", items: { type: "string" } },
            quick_wins: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      const totalIssues = 
        (analysis.critical_issues?.length || 0) + 
        (analysis.performance_issues?.length || 0) + 
        (analysis.architecture_issues?.length || 0);

      // Only send email if there are issues or the health score is below 80
      if (totalIssues > 0 || (analysis.health_score && analysis.health_score < 80)) {
        // Generate email report
        const emailBody = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🤖 Project Health Report</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">AI Agent Monitoring: ${project.name}</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <div style="background: ${analysis.health_score >= 80 ? '#d1fae5' : analysis.health_score >= 60 ? '#fef3c7' : '#fee2e2'}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <div style="font-size: 32px; font-weight: bold; color: ${analysis.health_score >= 80 ? '#065f46' : analysis.health_score >= 60 ? '#92400e' : '#991b1b'};">
        ${analysis.health_score}/100
      </div>
      <div style="color: #6b7280; font-size: 14px;">Overall Health Score</div>
    </div>

    ${analysis.critical_issues?.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 12px 0;">🚨 Critical Issues</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${analysis.critical_issues.map(issue => `<li style="margin-bottom: 8px;">${issue}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.performance_issues?.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #f59e0b; font-size: 18px; margin: 0 0 12px 0;">⚡ Performance Issues</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${analysis.performance_issues.map(issue => `<li style="margin-bottom: 8px;">${issue}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.architecture_issues?.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #8b5cf6; font-size: 18px; margin: 0 0 12px 0;">🏗️ Architecture Issues</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${analysis.architecture_issues.map(issue => `<li style="margin-bottom: 8px;">${issue}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.quick_wins?.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #10b981; font-size: 18px; margin: 0 0 12px 0;">✨ Quick Wins</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${analysis.quick_wins.map(win => `<li style="margin-bottom: 8px;">${win}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${analysis.recommendations?.length > 0 ? `
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 24px;">
      <h2 style="color: #4b5563; font-size: 16px; margin: 0 0 12px 0;">💡 Recommendations</h2>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
        ${analysis.recommendations.slice(0, 5).map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Scanned: ${entities.length} entities, ${pages.length} pages, ${components.length} components</p>
      <p style="margin: 8px 0 0 0;">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</div>
`;

        // Send email to project owner or creator
        const recipientEmail = project.created_by || project.owner_email;
        
        if (recipientEmail) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipientEmail,
            subject: `🤖 Project Health Report: ${project.name} (Score: ${analysis.health_score}/100)`,
            body: emailBody
          });

          reports.push({
            project: project.name,
            health_score: analysis.health_score,
            total_issues: totalIssues,
            email_sent: true
          });
        }
      } else {
        reports.push({
          project: project.name,
          health_score: analysis.health_score,
          status: 'healthy',
          email_sent: false
        });
      }
    }

    return Response.json({
      success: true,
      scanned: projects.length,
      reports: reports,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Project monitoring error:', error);
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});