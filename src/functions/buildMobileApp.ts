import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { app_id } = await req.json();

    if (!app_id) {
      return Response.json({ error: 'App ID required' }, { status: 400 });
    }

    const app = await base44.entities.MobileApp.get(app_id);

    if (!app) {
      return Response.json({ error: 'App not found' }, { status: 404 });
    }

    // Update status to building
    await base44.entities.MobileApp.update(app_id, {
      status: 'building',
      last_build_at: new Date().toISOString()
    });

    const buildWebhook = Deno.env.get('MOBILE_BUILD_WEBHOOK_URL');

    if (!buildWebhook) {
      return Response.json(
        { error: 'Mobile build provider not configured. Set MOBILE_BUILD_WEBHOOK_URL.' },
        { status: 501 }
      );
    }

    const buildId = crypto.randomUUID();

    await base44.entities.MobileApp.update(app_id, {
      status: 'queued',
      last_build_at: new Date().toISOString(),
      build_id: buildId
    });

    try {
      await fetch(buildWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build_id: buildId,
          app_id,
          platform: app.platform,
          app_name: app.name,
          build_config: app.build_config || {}
        })
      });
    } catch (err) {
      await base44.entities.MobileApp.update(app_id, {
        status: 'failed'
      });
      return Response.json(
        { error: 'Failed to queue mobile build request' },
        { status: 502 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Build queued successfully',
        build_id: buildId,
        status: 'queued'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Build mobile app error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
