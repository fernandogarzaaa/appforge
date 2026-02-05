import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Commits code changes to GitHub repository
 * Uses GitHub REST API to create/update files
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { repo_owner, repo_name, branch = 'main', file_path, content, message } = await req.json();

    if (!repo_owner || !repo_name || !file_path || !content || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = Deno.env.get('GITHUB_BOT_TOKEN');
    const botUsername = Deno.env.get('GITHUB_BOT_USERNAME');

    if (!token || !botUsername) {
      return Response.json({ error: 'GitHub bot credentials not configured' }, { status: 500 });
    }

    // Get current file SHA (if exists)
    let sha = null;
    try {
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${file_path}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': botUsername
          }
        }
      );

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }
    } catch {
      // File doesn't exist, will create new
    }

    // Create or update file
    const commitData = {
      message,
      content: btoa(content), // Base64 encode
      branch,
      ...(sha && { sha }) // Include SHA if updating existing file
    };

    const commitResponse = await fetch(
      `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${file_path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': botUsername
        },
        body: JSON.stringify(commitData)
      }
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    const result = await commitResponse.json();

    return Response.json({
      success: true,
      commit_sha: result.commit.sha,
      commit_url: result.commit.html_url,
      file_url: result.content.html_url
    });

  } catch (error) {
    console.error('GitHub commit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});