import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { plugin_id, method, args } = payload || {};

    if (!plugin_id) {
      return Response.json({ error: 'Missing plugin_id' }, { status: 400 });
    }

    const plugin = await base44.asServiceRole.entities.Plugin.get(plugin_id);
    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 });
    }

    const executeUrl = plugin.execute_url || plugin.endpoint || plugin.webhook_url;
    if (!executeUrl) {
      return Response.json({ error: 'Plugin does not define an execute_url' }, { status: 400 });
    }

    const response = await fetch(executeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plugin_id,
        method,
        args,
        user_id: user.email
      })
    });

    const text = await response.text();
    let data: any = text;
    try {
      data = JSON.parse(text);
    } catch {
      // keep raw text
    }

    await base44.asServiceRole.entities.PluginEvent.create({
      plugin_id,
      user_id: user.email,
      event_type: 'execute',
      status: response.ok ? 'success' : 'failed',
      metadata: {
        method,
        status: response.status
      },
      created_at: new Date().toISOString()
    });

    return Response.json({
      success: response.ok,
      status: response.status,
      data
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Plugin execution failed' }, { status: 500 });
  }
});
