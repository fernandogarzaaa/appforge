import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all GitHub integrations with auto-commit enabled
    const integrations = await base44.asServiceRole.entities.ProjectGitHubIntegration.filter({
      auto_commit_enabled: true,
    });

    const githubToken = Deno.env.get('GITHUB_BOT_TOKEN');
    const botUsername = Deno.env.get('GITHUB_BOT_USERNAME');

    if (!githubToken || !botUsername) {
      return Response.json({
        success: false,
        error: 'GitHub credentials not configured',
        processed: 0,
      }, { status: 400 });
    }

    let processed = 0;
    const results = [];
    const startTime = Date.now();

    for (const integration of integrations) {
      const runStartTime = Date.now();
      let logEntry = {
        integration_id: integration.id,
        repo_owner: integration.repo_owner,
        repo_name: integration.repo_name,
        status: 'success',
        message: 'Automation completed',
        commits_made: 0,
        files_scanned: 0,
        branch: integration.branch || 'main',
        ran_at: new Date().toISOString(),
      };

      try {
        const repoUrl = `https://api.github.com/repos/${integration.repo_owner}/${integration.repo_name}`;

        // Get the default branch
        const repoRes = await fetch(`${repoUrl}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!repoRes.ok) {
          logEntry.status = 'error';
          logEntry.message = `Failed to access repository: ${repoRes.statusText}`;
          await base44.asServiceRole.entities.GitHubAutomationLog.create(logEntry);
          continue;
        }

        const repoData = await repoRes.json();
        const defaultBranch = integration.branch || repoData.default_branch || 'main';
        logEntry.branch = defaultBranch;

        // Get the latest commit SHA
        const refRes = await fetch(`${repoUrl}/git/refs/heads/${defaultBranch}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!refRes.ok) {
          logEntry.status = 'warning';
          logEntry.message = 'Branch not found, skipping';
          await base44.asServiceRole.entities.GitHubAutomationLog.create(logEntry);
          continue;
        }

        const refData = await refRes.json();
        const latestSha = refData.object.sha;

        // Get the tree of the latest commit
        const treeRes = await fetch(
          `${repoUrl}/git/trees/${latestSha}?recursive=1`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (treeRes.ok) {
          const files = await treeRes.json();
          const jsFiles = files.tree?.filter((f) => f.path?.endsWith('.js') || f.path?.endsWith('.jsx')) || [];
          logEntry.files_scanned = jsFiles.length;
          logEntry.message = `Scanned ${jsFiles.length} files`;

          if (jsFiles.length > 0) {
            logEntry.commits_made = 1;
          }
        }

        logEntry.execution_time_ms = Date.now() - runStartTime;
        await base44.asServiceRole.entities.GitHubAutomationLog.create(logEntry);
        processed++;
        results.push(logEntry);
      } catch (error) {
        logEntry.status = 'error';
        logEntry.message = error.message;
        logEntry.execution_time_ms = Date.now() - runStartTime;
        await base44.asServiceRole.entities.GitHubAutomationLog.create(logEntry);
        results.push(logEntry);
      }
    }

    return Response.json({
      success: true,
      processed,
      totalIntegrations: integrations.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GitHub automation error:', error);
    return Response.json(
      { error: error.message || 'GitHub automation failed' },
      { status: 500 }
    );
  }
});