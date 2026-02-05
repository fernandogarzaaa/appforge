import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get AI agent configuration
    const configs = await base44.asServiceRole.entities.AIAgentConfig.list();
    const config = configs[0] || {
      autonomous_fixes_enabled: true,
      auto_fix_categories: ['validation', 'indexing', 'best_practices'],
      require_approval_for_critical: false
    };
    
    // Get all projects
    const projects = await base44.asServiceRole.entities.Project.list();
    
    if (!projects || projects.length === 0) {
      return Response.json({ message: 'No projects to monitor', scanned: 0 });
    }

    const reports = [];

    for (const project of projects) {
      const actionsTaken = [];
      const issuesFound = [];

      // Check if GitHub integration exists
      const githubIntegrations = await base44.asServiceRole.entities.ProjectGitHubIntegration
        .filter({ project_id: project.id, is_active: true })
        .catch(() => []);
      const githubIntegration = githubIntegrations[0];

      // Fetch project structure
      const [entities, pages, components] = await Promise.all([
        base44.asServiceRole.entities.Entity.filter({ project_id: project.id }).catch(() => []),
        base44.asServiceRole.entities.Page.filter({ project_id: project.id }).catch(() => []),
        base44.asServiceRole.entities.Component.filter({ project_id: project.id }).catch(() => [])
      ]);

      // AI Analysis with code generation
      const analysisPrompt = `Analyze this project and provide actionable fixes with code:

**Project:** ${project.name}
**Entities:** ${entities.length} (${entities.map(e => e.name).join(', ')})
**Pages:** ${pages.length} (${pages.map(p => p.name).join(', ')})
**Components:** ${components.length}

**Entity Schemas:**
${entities.map(e => `
${e.name}:
${JSON.stringify(e.schema?.properties || {}, null, 2).substring(0, 300)}
`).join('\n')}

**Page Sample:**
${pages[0] ? `${pages[0].name}: ${pages[0].code?.substring(0, 200)}` : 'No pages'}

For each issue, provide:
1. Issue description
2. Severity (critical/high/medium/low)
3. Category (validation/indexing/security/performance/best_practices/code_quality)
4. For CODE issues: provide the FULL corrected code file
5. For ENTITY issues: provide JSON schema changes
6. File path where fix should be applied
7. Whether it's safe to auto-apply

Focus on:
- Missing validations
- Security vulnerabilities
- Performance issues
- Code quality (unused imports, console.logs, etc)
- Best practices`;

      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  target_type: { type: "string" },
                  target_name: { type: "string" },
                  file_path: { type: "string" },
                  safe_to_auto_fix: { type: "boolean" },
                  fix_action: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      code: { type: "string" },
                      changes: { type: "object" }
                    }
                  }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Process issues and apply autonomous fixes
      if (analysis.issues && config.autonomous_fixes_enabled) {
        for (const issue of analysis.issues) {
          issuesFound.push({
            severity: issue.severity,
            category: issue.category,
            description: issue.description,
            auto_fixed: false
          });

          const canAutoFix = config.auto_fix_categories.includes(issue.category);
          const isCritical = issue.severity === 'critical';
          const requiresApproval = isCritical && config.require_approval_for_critical;

          if (canAutoFix && issue.safe_to_auto_fix && !requiresApproval && issue.fix_action) {
            try {
              // Database fixes (entities)
              if (issue.fix_action.type === 'update_entity_schema' && issue.target_name) {
                const entity = entities.find(e => e.name === issue.target_name);
                if (entity) {
                  const updatedSchema = {
                    ...entity.schema,
                    properties: {
                      ...entity.schema?.properties,
                      ...issue.fix_action.changes.properties
                    }
                  };

                  await base44.asServiceRole.entities.Entity.update(entity.id, {
                    schema: updatedSchema
                  });

                  actionsTaken.push({
                    action_type: 'entity_schema_update',
                    target: entity.name,
                    description: `Fixed: ${issue.description}`,
                    success: true,
                    committed_to_github: false
                  });

                  issuesFound[issuesFound.length - 1].auto_fixed = true;
                }
              }

              // Code fixes (pages/components) - Commit to GitHub
              if ((issue.fix_action.type === 'update_code' || issue.fix_action.type === 'fix_code') && 
                  issue.fix_action.code && 
                  issue.file_path &&
                  githubIntegration?.auto_commit_enabled) {
                
                // Commit to GitHub
                const commitResult = await base44.asServiceRole.functions.invoke('githubCommit', {
                  repo_owner: githubIntegration.repo_owner,
                  repo_name: githubIntegration.repo_name,
                  branch: githubIntegration.branch || 'main',
                  file_path: issue.file_path,
                  content: issue.fix_action.code,
                  message: `${githubIntegration.commit_prefix || '[AI-Bot]'} ${issue.description}`
                });

                if (commitResult.data.success) {
                  actionsTaken.push({
                    action_type: 'code_fix_committed',
                    target: issue.file_path,
                    description: `Fixed: ${issue.description}`,
                    success: true,
                    committed_to_github: true,
                    commit_url: commitResult.data.commit_url
                  });

                  issuesFound[issuesFound.length - 1].auto_fixed = true;
                }
              }

              // Add index
              if (issue.fix_action.type === 'add_index' && issue.target_name) {
                const entity = entities.find(e => e.name === issue.target_name);
                if (entity) {
                  const currentIndexes = entity.metadata?.indexes || [];
                  const newIndex = issue.fix_action.changes.index;
                  
                  if (newIndex && !currentIndexes.some(idx => idx.field === newIndex.field)) {
                    await base44.asServiceRole.entities.Entity.update(entity.id, {
                      metadata: {
                        ...entity.metadata,
                        indexes: [...currentIndexes, newIndex]
                      }
                    });

                    actionsTaken.push({
                      action_type: 'index_added',
                      target: `${entity.name}.${newIndex.field}`,
                      description: `Added index: ${issue.description}`,
                      success: true,
                      committed_to_github: false
                    });

                    issuesFound[issuesFound.length - 1].auto_fixed = true;
                  }
                }
              }
            } catch (fixError) {
              actionsTaken.push({
                action_type: 'fix_failed',
                target: issue.target_name || issue.file_path || 'unknown',
                description: `Failed: ${issue.description} - ${fixError.message}`,
                success: false,
                committed_to_github: false
              });
            }
          }
        }
      }

      // Save health report
      await base44.asServiceRole.entities.ProjectHealthReport.create({
        project_id: project.id,
        health_score: analysis.health_score,
        scan_timestamp: new Date().toISOString(),
        issues_found: issuesFound,
        actions_taken: actionsTaken,
        email_sent: false
      });

      const totalIssues = issuesFound.length;
      const fixedIssues = issuesFound.filter(i => i.auto_fixed).length;
      const githubCommits = actionsTaken.filter(a => a.committed_to_github).length;

      // Send email report if there are issues or actions taken
      if (totalIssues > 0 || actionsTaken.length > 0) {
        const emailBody = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🤖 AI Agent Report</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Autonomous Monitoring: ${project.name}</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <div style="background: ${analysis.health_score >= 80 ? '#d1fae5' : analysis.health_score >= 60 ? '#fef3c7' : '#fee2e2'}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <div style="font-size: 32px; font-weight: bold; color: ${analysis.health_score >= 80 ? '#065f46' : analysis.health_score >= 60 ? '#92400e' : '#991b1b'};">
        ${analysis.health_score}/100
      </div>
      <div style="color: #6b7280; font-size: 14px;">Health Score</div>
    </div>

    ${githubCommits > 0 ? `
    <div style="background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 16px;">
      <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 8px 0;">📝 GitHub Commits</h3>
      <p style="margin: 0; color: #1e3a8a; font-weight: 600;">${githubCommits} code fix${githubCommits > 1 ? 'es' : ''} committed to ${githubIntegration.repo_owner}/${githubIntegration.repo_name}</p>
    </div>
    ` : ''}

    ${actionsTaken.length > 0 ? `
    <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 24px;">
      <h2 style="color: #065f46; font-size: 18px; margin: 0 0 12px 0;">✅ Actions Taken (${actionsTaken.length})</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${actionsTaken.map(action => `
          <li style="margin-bottom: 8px;">
            <strong>${action.action_type}:</strong> ${action.description}
            ${action.success ? '<span style="color: #10b981;">✓</span>' : '<span style="color: #ef4444;">✗</span>'}
            ${action.commit_url ? `<br/><a href="${action.commit_url}" style="color: #3b82f6; font-size: 12px;">View commit</a>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${fixedIssues > 0 ? `
    <div style="background: #dbeafe; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 0; color: #1e40af; font-weight: 600;">
        🔧 Auto-Fixed: ${fixedIssues} of ${totalIssues} issues
      </p>
    </div>
    ` : ''}

    ${issuesFound.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #374151; font-size: 18px; margin: 0 0 12px 0;">📊 Issues (${totalIssues})</h2>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${issuesFound.slice(0, 10).map(issue => `
          <li style="margin-bottom: 8px;">
            <span style="background: ${
              issue.severity === 'critical' ? '#fecaca' : 
              issue.severity === 'high' ? '#fed7aa' : 
              issue.severity === 'medium' ? '#fef3c7' : '#dbeafe'
            }; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${issue.severity}
            </span>
            ${issue.description}
            ${issue.auto_fixed ? ' <span style="color: #10b981;">✓ Fixed</span>' : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Mode: ${config.autonomous_fixes_enabled ? '🤖 Autonomous' : '👀 Monitor'}</p>
      ${githubIntegration ? `<p style="margin: 8px 0 0 0;">GitHub: ${githubIntegration.repo_owner}/${githubIntegration.repo_name} (${githubIntegration.branch})</p>` : ''}
      <p style="margin: 8px 0 0 0;">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</div>
`;

        const recipientEmail = config.notification_email || project.created_by || project.owner_email;
        
        if (recipientEmail) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipientEmail,
            subject: `🤖 AI Bot: ${githubCommits > 0 ? `${githubCommits} commits pushed to` : 'Monitoring'} ${project.name}`,
            body: emailBody
          });
        }
      }

      reports.push({
        project: project.name,
        health_score: analysis.health_score,
        issues_found: totalIssues,
        auto_fixed: fixedIssues,
        github_commits: githubCommits,
        actions_taken: actionsTaken.length
      });
    }

    return Response.json({
      success: true,
      scanned: projects.length,
      autonomous_mode: config.autonomous_fixes_enabled,
      reports: reports,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Agent error:', error);
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});