import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const githubRequest = async (token: string, method: string, endpoint: string, body?: any) => {
  const url = `https://api.github.com${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    // keep raw
  }

  if (!response.ok) {
    throw new Error(data?.message || `GitHub API error (${response.status})`);
  }

  return data;
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { action, provider = 'github' } = payload || {};

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    if (provider !== 'github') {
      return Response.json({ error: 'Only GitHub provider is supported in this build' }, { status: 400 });
    }

    const githubToken = Deno.env.get('GITHUB_BOT_TOKEN') || Deno.env.get('GITHUB_TOKEN');

    if (action === 'deploy') {
      const { workflowId } = payload;
      if (!workflowId) {
        return Response.json({ error: 'Missing workflowId' }, { status: 400 });
      }

      const workflow = await base44.asServiceRole.entities.GitWorkflow.get(workflowId);
      if (!workflow) {
        return Response.json({ error: 'Workflow not found' }, { status: 404 });
      }

      const updated = await base44.asServiceRole.entities.GitWorkflow.update(workflowId, {
        status: 'active',
        deployed_at: new Date().toISOString()
      });

      await base44.asServiceRole.entities.GitWorkflowDeployment.create({
        workflow_id: workflowId,
        status: 'deployed',
        created_at: new Date().toISOString(),
        user_id: user.email
      });

      return Response.json({ success: true, workflow: updated });
    }

    if (action === 'run') {
      const { workflowId, payload: runPayload = {} } = payload;
      if (!workflowId) {
        return Response.json({ error: 'Missing workflowId' }, { status: 400 });
      }

      const workflow = await base44.asServiceRole.entities.GitWorkflow.get(workflowId);
      if (!workflow) {
        return Response.json({ error: 'Workflow not found' }, { status: 404 });
      }

      const startedAt = new Date().toISOString();
      const run = await base44.asServiceRole.entities.GitWorkflowRun.create({
        workflow_id: workflowId,
        status: 'running',
        started_at: startedAt,
        payload: runPayload,
        user_id: user.email
      });

      const completedAt = new Date().toISOString();
      const updatedRun = await base44.asServiceRole.entities.GitWorkflowRun.update(run.id, {
        status: 'completed',
        completed_at: completedAt,
        duration_ms: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
        output: { message: 'Workflow run completed' }
      });

      await base44.asServiceRole.entities.GitWorkflow.update(workflowId, {
        runs_count: (workflow.runs_count || 0) + 1,
        last_run: completedAt
      });

      return Response.json({ success: true, run: updatedRun });
    }

    if (!githubToken && ['pull_requests', 'auto_review', 'generate_changelog'].includes(action)) {
      return Response.json({ error: 'GITHUB_BOT_TOKEN is not configured' }, { status: 400 });
    }

    if (action === 'pull_requests') {
      const { owner, repo, state = 'open' } = payload;
      if (!owner || !repo) {
        return Response.json({ error: 'Missing owner or repo' }, { status: 400 });
      }

      const prs = await githubRequest(githubToken, 'GET', `/repos/${owner}/${repo}/pulls?state=${state}`);
      return Response.json({ success: true, pull_requests: prs });
    }

    if (action === 'auto_review') {
      const { owner, repo, prNumber } = payload;
      if (!owner || !repo || !prNumber) {
        return Response.json({ error: 'Missing owner, repo, or prNumber' }, { status: 400 });
      }

      const pr = await githubRequest(githubToken, 'GET', `/repos/${owner}/${repo}/pulls/${prNumber}`);
      const files = await githubRequest(githubToken, 'GET', `/repos/${owner}/${repo}/pulls/${prNumber}/files`);

      const summary = files
        .map((file: any) => `- ${file.filename} (+${file.additions}/-${file.deletions})`)
        .slice(0, 50)
        .join('\n');

      const prompt = `You are a senior code reviewer. Provide a concise review summary and top risks.\n\nPR Title: ${pr.title}\nPR Description: ${pr.body || 'N/A'}\nChanged Files:\n${summary}`;

      const llm = await base44.integrations.Core.InvokeLLM({
        prompt,
        temperature: 0.2,
        max_tokens: 400
      });

      return Response.json({
        success: true,
        review: llm?.content || llm?.response || llm
      });
    }

    if (action === 'suggest_commit') {
      const { changes } = payload;
      const prompt = `Generate 3 conventional commit messages for the following changes:\n${changes}`;

      const llm = await base44.integrations.Core.InvokeLLM({
        prompt,
        temperature: 0.3,
        max_tokens: 200
      });

      return Response.json({
        success: true,
        suggestions: llm?.content || llm?.response || llm
      });
    }

    if (action === 'generate_changelog') {
      const { owner, repo, baseVersion = 'main' } = payload;
      if (!owner || !repo) {
        return Response.json({ error: 'Missing owner or repo' }, { status: 400 });
      }

      const compare = await githubRequest(
        githubToken,
        'GET',
        `/repos/${owner}/${repo}/compare/${baseVersion}...main`
      );

      const commits = (compare.commits || []).map((commit: any) => commit.commit?.message || commit.sha);
      const prompt = `Create a concise changelog from these commit messages:\n${commits.join('\n')}`;
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt,
        temperature: 0.2,
        max_tokens: 400
      });

      return Response.json({
        success: true,
        changelog: llm?.content || llm?.response || llm
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Git workflow failed' }, { status: 500 });
  }
});
