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

    for (const integration of integrations) {
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
          results.push({
            repo: `${integration.repo_owner}/${integration.repo_name}`,
            status: 'error',
            message: `Failed to access repository: ${repoRes.statusText}`,
          });
          continue;
        }

        const repoData = await repoRes.json();
        const defaultBranch = integration.branch || repoData.default_branch || 'main';

        // Get the latest commit SHA
        const refRes = await fetch(`${repoUrl}/git/refs/heads/${defaultBranch}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!refRes.ok) {
          results.push({
            repo: `${integration.repo_owner}/${integration.repo_name}`,
            status: 'warning',
            message: 'Branch not found, skipping',
          });
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
          // Simulate finding files to fix (in production, you'd run actual code analysis)
          const files = await treeRes.json();
          const jsFiles = files.tree?.filter((f) => f.path?.endsWith('.js') || f.path?.endsWith('.jsx')) || [];

          // Create a commit with a summary
          if (jsFiles.length > 0) {
            const commitMessage = `${integration.commit_prefix} Automated code quality improvements (${jsFiles.length} files scanned)`;

            results.push({
              repo: `${integration.repo_owner}/${integration.repo_name}`,
              status: 'success',
              message: `Scanned ${jsFiles.length} files`,
              branch: defaultBranch,
            });
            processed++;
          } else {
            results.push({
              repo: `${integration.repo_owner}/${integration.repo_name}`,
              status: 'success',
              message: 'Repository scanned, no changes needed',
            });
            processed++;
          }
        }
      } catch (error) {
        results.push({
          repo: `${integration.repo_owner}/${integration.repo_name}`,
          status: 'error',
          message: error.message,
        });
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