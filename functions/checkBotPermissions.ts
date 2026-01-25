import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bot_id, required_action } = await req.json();

    if (!bot_id) {
      return Response.json({ error: 'Missing bot_id' }, { status: 400 });
    }

    // Get bot
    const bots = await base44.entities.Bot.filter({ id: bot_id });
    if (bots.length === 0) {
      return Response.json({ error: 'Bot not found' }, { status: 404 });
    }

    const bot = bots[0];

    // Check if user is creator (owner)
    if (bot.created_by === user.email) {
      return Response.json({ 
        allowed: true, 
        role: 'owner',
        permissions: {
          can_edit_workflow: true,
          can_delete_bot: true,
          can_manage_collaborators: true,
          can_deploy: true
        }
      });
    }

    // Check collaborator status
    const collaborators = await base44.entities.BotCollaborator.filter({
      bot_id,
      user_email: user.email
    });

    if (collaborators.length === 0) {
      return Response.json({ 
        allowed: false, 
        role: 'none',
        message: 'User is not a collaborator on this bot'
      });
    }

    const collaborator = collaborators[0];

    // Define permissions by role
    const rolePermissions = {
      owner: {
        can_edit_workflow: true,
        can_delete_bot: true,
        can_manage_collaborators: true,
        can_deploy: true
      },
      editor: {
        can_edit_workflow: true,
        can_delete_bot: false,
        can_manage_collaborators: false,
        can_deploy: false
      },
      reviewer: {
        can_edit_workflow: false,
        can_delete_bot: false,
        can_manage_collaborators: false,
        can_deploy: false
      },
      viewer: {
        can_edit_workflow: false,
        can_delete_bot: false,
        can_manage_collaborators: false,
        can_deploy: false
      }
    };

    const permissions = rolePermissions[collaborator.role] || rolePermissions.viewer;

    // Check if user can perform required action
    const allowed = required_action ? permissions[`can_${required_action}`] : true;

    return Response.json({
      allowed,
      role: collaborator.role,
      permissions
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});