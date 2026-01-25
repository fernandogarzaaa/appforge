import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bot_id, action_type, action_description, changes, affected_node_id } = await req.json();

    if (!bot_id || !action_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create activity log
    const log = await base44.entities.BotActivityLog.create({
      bot_id,
      user_email: user.email,
      action_type,
      action_description: action_description || `User performed: ${action_type}`,
      changes,
      affected_node_id,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});