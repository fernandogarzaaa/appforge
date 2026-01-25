import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { timingSafeEqual, createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-gitlab-token');
    const body = await req.text();

    // Parse webhook payload
    let payload;
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      payload = JSON.parse(body);
    } else {
      return Response.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Determine git provider
    let provider = 'github';
    let repositoryUrl = payload.repository?.html_url;
    let branch = payload.ref?.split('/').pop();
    let commitHash = payload.after || payload.checkout_sha;
    let commitMessage = payload.head_commit?.message || payload.commits?.[0]?.message;
    let authorEmail = payload.head_commit?.author?.email || payload.commits?.[0]?.author?.email;
    let event = 'push';

    if (payload.pull_request) {
      event = 'pull_request';
      branch = payload.pull_request.head.ref;
      commitHash = payload.pull_request.head.sha;
    } else if (payload.object_kind === 'push') {
      provider = 'gitlab';
    } else if (payload.object_kind === 'merge_request') {
      provider = 'gitlab';
      event = 'pull_request';
    }

    if (!repositoryUrl || !branch) {
      return Response.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Find pipeline by repository URL
    const pipelines = await base44.entities.BotPipeline.filter({
      repository_url: repositoryUrl
    });

    if (!pipelines || pipelines.length === 0) {
      return Response.json({ error: 'No pipeline configured for this repository' }, { status: 404 });
    }

    const pipeline = pipelines[0];

    // Verify webhook signature - only for GitHub format
    if (signature && pipeline.webhook_secret && signature.startsWith('sha256=')) {
      const secret = pipeline.webhook_secret;
      const hmac = createHmac('sha256', secret);
      hmac.update(body);
      const expectedSignature = `sha256=${hmac.digest('hex')}`;

      try {
        if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
          return Response.json({ error: 'Invalid signature' }, { status: 401 });
        }
      } catch (e) {
        return Response.json({ error: 'Signature verification failed' }, { status: 401 });
      }
    } else if (signature && pipeline.webhook_secret) {
      // GitLab format - direct token comparison
      if (signature !== pipeline.webhook_secret) {
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Check if this event and branch should trigger pipeline
    const shouldTrigger = 
      pipeline.trigger_events?.includes(event) &&
      (pipeline.trigger_branches?.length === 0 || 
       pipeline.trigger_branches?.some(pattern => {
         const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
         return regex.test(branch);
       }));

    if (!shouldTrigger) {
      return Response.json({ message: 'Event/branch does not match trigger conditions' }, { status: 200 });
    }

    // Create pipeline run
    const run = await base44.entities.PipelineRun.create({
      pipeline_id: pipeline.id,
      bot_id: pipeline.bot_id,
      status: 'pending',
      trigger_source: event,
      git_ref: branch,
      commit_hash: commitHash,
      commit_message: commitMessage,
      author_email: authorEmail,
      started_at: new Date().toISOString(),
      logs: [`Webhook received for ${event} on ${branch}`]
    });

    // Execute pipeline asynchronously
    try {
      await base44.functions.invoke('executeBotPipeline', {
        pipelineRunId: run.id,
        pipelineId: pipeline.id,
        botId: pipeline.bot_id
      });
    } catch (e) {
      console.error('Failed to execute pipeline:', e);
      // Still return success as run was created
    }

    return Response.json({
      success: true,
      runId: run.id,
      message: 'Pipeline execution started'
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});